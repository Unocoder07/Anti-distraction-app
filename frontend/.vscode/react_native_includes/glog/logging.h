// Minimal stub of glog/logging.h for IntelliSense only.
#ifndef REACT_NATIVE_GLOG_LOGGING_H_STUB
#define REACT_NATIVE_GLOG_LOGGING_H_STUB

#include <iostream>

namespace react_native_glog_stub
{
    struct LogMessage
    {
        LogMessage(const char * /*file*/, int /*line*/, int /*severity*/ = 0) {}
        ~LogMessage() {}

        template <typename T>
        LogMessage &operator<<(T const &)
        {
            return *this;
        }
    };
} // namespace react_native_glog_stub

// Provide a simple LOG(...) macro that returns a stream-like object.
#define LOG(severity) react_native_glog_stub::LogMessage(__FILE__, __LINE__, 0)

#endif // REACT_NATIVE_GLOG_LOGGING_H_STUB
