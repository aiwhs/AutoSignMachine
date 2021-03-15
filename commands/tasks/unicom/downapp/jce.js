"use strict";
/**
 * @typedef Readable
 */
const Readable = require("stream").Readable;
class JceError extends Error {};
const BUF0 = Buffer.alloc(0);

/**
 * @typedef {Object} JceStruct jce data struct
 * K是字段名(String)，V是tag值(UInt8)
 */

const TYPE_INT8 = 0;
const TYPE_INT16 = 1;
const TYPE_INT32 = 2;
const TYPE_INT64 = 3;
const TYPE_FLOAT = 4;
const TYPE_DOUBLE = 5;
const TYPE_STRING1 = 6;
const TYPE_STRING4 = 7;
const TYPE_MAP = 8;
const TYPE_LIST = 9;
const TYPE_STRUCT_BEGIN = 10;
const TYPE_STRUCT_END = 11;
const TYPE_ZERO = 12;
const TYPE_SIMPLE_LIST = 13;

const TAG_MAP_K = 0;
const TAG_MAP_V = 1;
const TAG_LIST_E = 0;
const TAG_BYTES = 0;
const TAG_LENGTH = 0;
const TAG_STRUCT_END = 0;

let _encoding = "utf8";

/**
 * @param {Readable} stream 
 * @returns {Object} {tag: UInt8, type: UInt8, raw: Buffer}
 */
function readHead(stream, return_raw = false) {
    let raw = stream.read(1);
    const head = raw.readUInt8();
    const type = head & 0xf;
    let tag = (head & 0xf0) >> 4;
    if (tag === 0xf) {
        tag = stream.read(1);
        if (return_raw)
            raw = Buffer.concat([raw, tag]);
        tag = tag.readUInt8();
    }
    return {tag, type, raw};
}

/**
 * @param {Readable} stream 
 * @param {Number} type UInt8 0~13
 * @returns {any}
 */
function readBody(stream, type) {
    var len;
    switch(type) {
        case TYPE_INT8:
            return stream.read(1).readInt8();
        case TYPE_INT16:
            return stream.read(2).readInt16BE();
        case TYPE_INT32:
            return stream.read(4).readInt32BE();
        case TYPE_INT64:
            var value = stream.read(8).readBigInt64BE();
            if (value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER)
                value = parseInt(value);
            return value;
        case TYPE_FLOAT:
            return stream.read(4).readFloatBE();
        case TYPE_DOUBLE:
            return stream.read(8).readDoubleBE();
        case TYPE_STRING1:
            len = stream.read(1).readUInt8();
            return len > 0 ? stream.read(len).toString(_encoding) : "";
        case TYPE_STRING4:
            len = stream.read(4).readUInt32BE();
            return len > 0 ? stream.read(len).toString(_encoding) : "";
        case TYPE_MAP:
            len = readElement(stream).value;
            const map = {};
            while(len > 0) {
                map[readElement(stream).value.toString(_encoding)] = readElement(stream).value;
                --len;
            }
            return map;
        case TYPE_LIST:
            len = readElement(stream).value;
            const list = [];
            while(len > 0) {
                list.push(readElement(stream).value);
                --len;
            }
            return list;
        case TYPE_STRUCT_BEGIN:
            return Buffer.alloc(0);
        case TYPE_STRUCT_END:
            return Buffer.alloc(0);
        case TYPE_ZERO:
            return 0;
        case TYPE_SIMPLE_LIST:
            readHead(stream);
            len = readElement(stream).value;
            return len > 0 ? stream.read(len) : BUF0;
        default:
            throw new JceError("unknown jce type: " + type)
    }
}

/**
 * @param {Readable} stream 
 * @param {Number} type UInt8 0~13
 * @returns {Buffer}
 */
function skipField(stream, type) {
    const chunk = [];
    var len, l;
    switch (type) {
        case TYPE_INT8:
            chunk.push(stream.read(1));
            break;
        case TYPE_INT16:
            chunk.push(stream.read(2));
            break;
        case TYPE_INT32:
        case TYPE_FLOAT:
            chunk.push(stream.read(4));
            break;
        case TYPE_INT64:
        case TYPE_DOUBLE:
            chunk.push(stream.read(8));
            break;
        case TYPE_STRING1:
            len = stream.read(1);
            chunk.push(len);
            l = len.readUInt8();
            chunk.push(l>0?stream.read(l):BUF0);
            break;
        case TYPE_STRING4:
            len = stream.read(4);
            chunk.push(len);
            l = len.readUInt32BE();
            chunk.push(l>0?stream.read(l):BUF0);
            break;
        case TYPE_LIST:
        case TYPE_MAP:
        case TYPE_STRUCT_BEGIN:
        case TYPE_STRUCT_END:
        case TYPE_ZERO:
            break;
        case TYPE_SIMPLE_LIST:
            chunk.push(stream.read(1));
            const {type, raw} = readHead(stream, true);
            chunk.push(raw);
            len = readBody(stream, type);
            chunk.push(createBody(type, len));
            chunk.push(len>0?stream.read(len):BUF0);
            break;
    }
    return Buffer.concat(chunk);
}

/**
 * @param {Readable} stream 
 * @returns {Buffer}
 */
function skipStruct(stream) {
    const chunks = [];
    let nested_struct_num = 0;
    while(stream.readableLength) {
        const {type, raw} = readHead(stream, true);
        if (type === TYPE_STRUCT_BEGIN) {
            ++nested_struct_num;
        }
        if (type === TYPE_STRUCT_END) {
            --nested_struct_num;
            if (nested_struct_num < 0)
            break;
        }
        chunks.push(raw);
        chunks.push(skipField(stream, type));
    }
    return Buffer.concat(chunks);
}

/**
 * @param {Readable} stream 
 * @returns {Object} {tag: UInt8, value: any}
 */
function readElement(stream) {
    var value;
    const head = readHead(stream);
    console.log('head', head)
    if (head.type === TYPE_STRUCT_BEGIN) {
        value = skipStruct(stream);
    } else {
        value = readBody(stream, head.type);
    }
    return {
        tag: head.tag, value
    };
}

//------------------------------------------------------------------

class Nested {
    constructor(data) {
        this.data = data;
    }
}

/**
 * @param {Number} type UInt8 0~13
 * @param {Number} tag UInt8
 * @returns {Buffer}
 */
function createHead(type, tag) {
    if (tag < 15) {
        return Buffer.from([(tag<<4)|type]);
    } else if (tag < 256) {
        return Buffer.from([0xf0|type, tag]);
    } else {
        throw new JceError("Tag must be less than 256")
    }
}

/**
 * @param {Number} type UInt8 0~13
 * @param {Number|BigInt|String|Buffer|Array|Object} value 
 * @returns {Buffer}
 */
function createBody(type, value) {
    var body, len;
    switch (type) {
        case TYPE_INT8:
            return Buffer.from([parseInt(value)]);
        case TYPE_INT16:
            body = Buffer.alloc(2);
            body.writeInt16BE(parseInt(value));
            return body;
        case TYPE_INT32:
            body = Buffer.alloc(4);
            body.writeInt32BE(parseInt(value));
            return body;
        case TYPE_INT64:
            body = Buffer.alloc(8);
            body.writeBigInt64BE(BigInt(value));
            return body;
        case TYPE_FLOAT:
            body = Buffer.alloc(4);
            body.writeFloatBE(value);
            return body;
        case TYPE_DOUBLE:
            body = Buffer.alloc(8);
            body.writeDoubleBE(value);
            return body;
        case TYPE_STRING1:
            len = Buffer.from([value.length]);
            return Buffer.concat([len, Buffer.from(value)]);
        case TYPE_STRING4:
            len = Buffer.alloc(4);
            len.writeUInt32BE(value.length);
            return Buffer.concat([len, Buffer.from(value)]);
        case TYPE_MAP:
            body = [];
            let n = 0;
            for (let k of Object.keys(value)) {
                ++n;
                body.push(createElement(TAG_MAP_K, k));
                body.push(createElement(TAG_MAP_V, value[k]));
            }
            body.unshift(createElement(TAG_LENGTH, n));
            return Buffer.concat(body);
        case TYPE_LIST:
            body = [createElement(TAG_LENGTH, value.length)];
            for (let i = 0; i < value.length; ++i) {
                body.push(createElement(TAG_LIST_E, value[i]));
            }
            return Buffer.concat(body);
        // case TYPE_STRUCT_BEGIN:
        // case TYPE_STRUCT_END:
        case TYPE_ZERO:
            return Buffer.alloc(0);
        case TYPE_SIMPLE_LIST:
            return Buffer.concat([createHead(0, TAG_BYTES), createElement(TAG_LENGTH, value.length), value]);
    }
}

/**
 * @param {Number} tag UInt8
 * @param {Number|BigInt|String|Buffer|Array|Object|Nested} value 
 * @returns {Buffer}
 */
function createElement(tag, value) {
    if (value instanceof Nested) {
        const begin = createHead(TYPE_STRUCT_BEGIN, tag);
        const end = createHead(TYPE_STRUCT_END, TAG_STRUCT_END);
        return Buffer.concat([begin, value.data, end]);
    }
    let type = typeof value;
    switch (type) {
        case "string":
            value = Buffer.from(value, _encoding);
            type = value.length <= 0xff ? TYPE_STRING1 : TYPE_STRING4;
            break;
        case "object":
            if (value === null)
                throw new JceError("Unsupported type: null");
            if (value instanceof Buffer || value instanceof Uint8Array || value instanceof ArrayBuffer)
                type = TYPE_SIMPLE_LIST;
            else
                type = Array.isArray(value) ? TYPE_LIST : TYPE_MAP;
            break;
        case "bigint":
        case "number":
            if (value == 0)
                type = TYPE_ZERO;
            else if (Number.isInteger(value) || type === "bigint") {
                if (value >= -0x80 && value <= 0x7f)
                    type = TYPE_INT8;
                else if (value >= -0x8000 && value <= 0x7fff)
                    type = TYPE_INT16;
                else if (value >= -0x80000000 && value <= 0x7fffffff)
                    type = TYPE_INT32;
                else if (value >= -0x8000000000000000n && value <= 0x7fffffffffffffffn)
                    type = TYPE_INT64;
                else
                    throw new JceError("Unsupported integer range: " + value);
            } else {
                type = TYPE_DOUBLE; //we don't use float
            }
            break;
        default:
            throw new JceError("Unsupported type: " + type);
    }
    const head = createHead(type, tag);
    const body = createBody(type, value);
    return Buffer.concat([head, body]);
}

//--------------------------------------------------------------------

/**
 * 设置字符串编码
 * @see https://nodejs.org/dist/latest/docs/api/buffer.html#buffer_buffers_and_character_encodings
 * @param {String} encoding
 * @returns {void}
 */
function setEncoding(encoding = "utf8") {
    _encoding = encoding;
}

/**
 * 调用此函数进行jce解码
 * 嵌套结构会跳过并返回此段buffer，需要再次decode
 * @param {Buffer} blob 
 * @param {JceStruct|undefined} struct undefined时tag作为键返回
 * @returns {Object} 键值对
 */
function decode(blob, struct = undefined) {
    const stream = Readable.from(blob, {objectMode: false});
    stream.read(0);
    const result = {};
    while(stream.readableLength) {
        const {tag, value} = readElement(stream, struct);
        if (struct) {
            const name = Object.keys(struct).find((v)=>struct[v]===tag);
            if (name)
                result[name] = value;
        } else {
            result[tag] = value;
        }
    }
    return result;
}

/**
 * 调用此函数进行jce编码
 * @param {Object|Array} object 键值对或数组(值为null或undefined自动跳过此tag)
 * @param {JceStruct|undefined} struct undefined时取object的键为tag
 * @returns {Buffer}
 */
function encode(object, struct = undefined) {
    const elements = [];
    if (!struct) {
        if (Array.isArray(object)) {
            for (let i = 0; i < object.length; ++i) {
                if (object[i] === null || object[i] === undefined)
                    continue;
                elements.push(createElement(i, object[i]));
            }
        } else {
            for (let i of Object.keys(object)) {
                if (object[i] === null || object[i] === undefined)
                    continue;
                elements.push(createElement(parseInt(i), object[i]));
            }
        }
    } else {
        for (const name of Object.keys(struct)) {
            if (!object.hasOwnProperty(name))
                continue;
            elements.push(createElement(struct[name], object[name]));
        }
    }
    return Buffer.concat(elements);
}

/**
 * 嵌套结构数据必须调用此函数创建，暂不支持在struct中直接定义
 * @param {Object|Array} object 
 * @param {JceStruct|undefined} struct 
 * @returns {Nested}
 */
function encodeNested(object, struct) {
    return new Nested(encode(object, struct));
}

module.exports = {
    setEncoding, decode, encode, encodeNested
};