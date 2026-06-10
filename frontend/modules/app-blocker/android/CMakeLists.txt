cmake_minimum_required(VERSION 3.4.1)

project(appblocker)

add_library(appblocker SHARED
  src/main/cpp/AppBlockerModule.cpp
)

# Link with required Android libraries
target_link_libraries(appblocker
  ${CMAKE_DL_LIBS}
  log
)
