use anyhow::Result;
use objc::{class, msg_send, sel, sel_impl};

pub fn create(window_handle: u64) -> Result<String> {
    let nslog = sel!(NSLog);

    println!("nslog: {:?}", nslog);
    // msg_send![nslog, ]
    // let cls = class!(NSLog);
    // let obj: *mut Object = msg_send![cls, new];
    // let hash: usize = msg_send![obj, hash];
    // let is_kind: BOOL = msg_send![obj, isKindOfClass:cls];
    // // Even void methods must have their return type annotated
    // let _: () = msg_send![obj, release];

    Ok("not implemented".to_owned())
}
