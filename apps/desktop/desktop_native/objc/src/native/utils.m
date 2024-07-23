#import "utils.h"

NSString *dictionaryToJsonString(NSDictionary *dictionary, NSError *error) {
  NSData *data = [NSJSONSerialization dataWithJSONObject:dictionary options:0 error:&error];
  if (error) {
    return nil;
  }
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

NSString *toSuccess(NSDictionary *value) {
  NSDictionary *wrapper = @{@"type": @"success", @"value": value};
  NSError *jsonError = nil;
  NSString *toReturn = dictionaryToJsonString(wrapper, jsonError);

  if (jsonError) {
    return [NSString stringWithFormat:@"{\"type\": \"error\", \"error\": \"Error occurred while serializing error: %@\"}", jsonError];
  }

  return toReturn;
}

NSString *toError(NSString *error) {
  NSDictionary *errorDictionary = @{@"type": @"error", @"error": error};
  NSError *jsonError = nil;
  NSString *toReturn = dictionaryToJsonString(errorDictionary, jsonError);

  if (jsonError) {
    return [NSString stringWithFormat:@"{\"type\": \"error\", \"error\": \"Error occurred while serializing error: %@\"}", jsonError];
  }

  return toReturn;
}
