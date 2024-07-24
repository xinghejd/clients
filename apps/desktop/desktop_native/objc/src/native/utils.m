#import "utils.h"

NSDictionary *parseJson(NSString *jsonString, NSError *error) {
  NSData *data = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
  if (error) {
    return nil;
  }
  return json;
}

NSString *serializeJson(NSDictionary *dictionary, NSError *error) {
  NSData *data = [NSJSONSerialization dataWithJSONObject:dictionary options:0 error:&error];
  if (error) {
    return nil;
  }
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}
