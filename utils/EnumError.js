class BusinessError extends Error { }
class TryNextEvent extends Error { }
class CompleteEvent extends Error { }

module.exports = {
    BusinessError,
    TryNextEvent,
    CompleteEvent
}