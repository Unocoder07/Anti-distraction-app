#include <jni.h>

// Minimal JNI entry point for native library
extern "C" {
    JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved) {
        return JNI_VERSION_1_6;
    }
}
