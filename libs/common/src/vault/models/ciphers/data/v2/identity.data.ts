import { IdentityApiV2 } from "../../api/v2/identity.api";
import { IdentityDataV1 } from "../v1/identity.data";

export class IdentityDataV2 {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  company: string;
  email: string;
  phone: string;
  ssn: string;
  username: string;
  passportNumber: string;
  licenseNumber: string;

  constructor(data?: IdentityApiV2) {
    if (data == null) {
      return;
    }

    this.title = data.title;
    this.firstName = data.firstName;
    this.middleName = data.middleName;
    this.lastName = data.lastName;
    this.address1 = data.address1;
    this.address2 = data.address2;
    this.address3 = data.address3;
    this.city = data.city;
    this.state = data.state;
    this.postalCode = data.postalCode;
    this.country = data.country;
    this.company = data.company;
    this.email = data.email;
    this.phone = data.phone;
    this.ssn = data.ssn;
    this.username = data.username;
    this.passportNumber = data.passportNumber;
    this.licenseNumber = data.licenseNumber;
  }

  static migrate(old: IdentityDataV1): IdentityDataV2 {
    const migrated = new IdentityDataV2();

    migrated.title = old.title;
    migrated.firstName = old.firstName;
    migrated.middleName = old.middleName;
    migrated.lastName = old.lastName;
    migrated.address1 = old.address1;
    migrated.address2 = old.address2;
    migrated.address3 = old.address3;
    migrated.city = old.city;
    migrated.state = old.state;
    migrated.postalCode = old.postalCode;
    migrated.country = old.country;
    migrated.company = old.company;
    migrated.email = old.email;
    migrated.phone = old.phone;
    migrated.ssn = old.ssn;
    migrated.username = old.username;
    migrated.passportNumber = old.passportNumber;
    migrated.licenseNumber = old.licenseNumber;

    return migrated;
  }
}
