use anyhow::{anyhow, Result};
use libsecret::{password_clear_sync, password_lookup_sync, password_store_sync, Schema};
use std::{collections::HashMap, time::Duration};

pub fn get_password(service: &str, account: &str) -> Result<String> {
    let res = password_lookup_sync(
        Some(&get_schema()),
        build_attributes(service, account),
        gio::Cancellable::NONE,
    )?;

    match res {
        Some(s) => Ok(String::from(s)),
        None => Err(anyhow!("No password found")),
    }
}

// Query dbus names looking for the org.freedesktop.secrets service, which indicates an active libsecret provider
pub fn has_password_management() -> bool {
    let conn = match dbus::blocking::SyncConnection::new_session() {
        Ok(conn) => conn,
        Err(_) => return false,
    };
    let proxy = conn.with_proxy(
        "org.freedesktop.DBus",
        "/org/freedesktop/DBus",
        Duration::from_millis(250),
    );
    let (names,): (Vec<String>,) = match proxy.method_call("org.freedesktop.DBus", "ListNames", ())
    {
        Ok(names) => names,
        Err(_) => return false,
    };
    names.contains(&"org.freedesktop.secrets".to_string())
}

pub fn get_password_keytar(service: &str, account: &str) -> Result<String> {
    get_password(service, account)
}

pub fn set_password(service: &str, account: &str, password: &str) -> Result<()> {
    let result = password_store_sync(
        Some(&get_schema()),
        build_attributes(service, account),
        Some(&libsecret::COLLECTION_DEFAULT),
        &format!("{}/{}", service, account),
        password,
        gio::Cancellable::NONE,
    )?;
    Ok(result)
}

pub fn delete_password(service: &str, account: &str) -> Result<()> {
    let result = password_clear_sync(
        Some(&get_schema()),
        build_attributes(service, account),
        gio::Cancellable::NONE,
    )?;
    Ok(result)
}

fn get_schema() -> Schema {
    let mut attributes = std::collections::HashMap::new();
    attributes.insert("service", libsecret::SchemaAttributeType::String);
    attributes.insert("account", libsecret::SchemaAttributeType::String);

    libsecret::Schema::new(
        "org.freedesktop.Secret.Generic",
        libsecret::SchemaFlags::NONE,
        attributes,
    )
}

fn build_attributes<'a>(service: &'a str, account: &'a str) -> HashMap<&'a str, &'a str> {
    let mut attributes = HashMap::new();
    attributes.insert("service", service);
    attributes.insert("account", account);

    attributes
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test() {
        scopeguard::defer!(delete_password("BitwardenTest", "BitwardenTest").unwrap_or({}););
        set_password("BitwardenTest", "BitwardenTest", "Random").unwrap();
        assert_eq!(
            "Random",
            get_password("BitwardenTest", "BitwardenTest").unwrap()
        );
        delete_password("BitwardenTest", "BitwardenTest").unwrap();

        // Ensure password is deleted
        match get_password("BitwardenTest", "BitwardenTest") {
            Ok(_) => panic!("Got a result"),
            Err(e) => assert_eq!("No password found", e.to_string()),
        }
    }

    #[test]
    fn test_error_no_password() {
        match get_password("BitwardenTest", "BitwardenTest") {
            Ok(_) => panic!("Got a result"),
            Err(e) => assert_eq!("No password found", e.to_string()),
        }
    }
}
