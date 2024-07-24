#ifndef RUST_H
#define RUST_H

#import <Foundation/Foundation.h>

/// Simple struct to hold a C-string and its length
/// This is used to return strings created in Objective-C to Rust
/// so that Rust can free the memory when it's done with the string
struct ObjCString
{
  char *value;
  size_t size;
};

/// Function to call from Objective-C to return a string to Rust
extern void commandReturn(void *context, struct ObjCString output);

#endif
