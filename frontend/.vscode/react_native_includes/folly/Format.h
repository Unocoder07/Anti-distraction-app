// Minimal stub of folly/Format.h for IntelliSense only.
#ifndef REACT_NATIVE_FOLLY_FORMAT_H_STUB
#define REACT_NATIVE_FOLLY_FORMAT_H_STUB

#include <string>
#include <utility>

namespace folly
{
    template <typename... Args>
    inline std::string sformat(const std::string &fmt, Args &&.../*args*/)
    {
        // Naive stub: return the format string as-is.
        return fmt;
    }
} // namespace folly

#endif // REACT_NATIVE_FOLLY_FORMAT_H_STUB
