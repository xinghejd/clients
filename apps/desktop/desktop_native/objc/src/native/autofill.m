#import <Foundation/Foundation.h>

void hello_world(char* value, char* output, int output_size)
{
  NSString *string = [[NSString alloc] initWithUTF8String:value];
  NSLog(@"Objc from rust, hello: %@", string);

  NSString *outputString = @"Hello, World from objc!";
  [outputString getCString:output maxLength:output_size encoding:NSUTF8StringEncoding];
}
