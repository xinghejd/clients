import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";

import { CipherFormGeneratorComponent } from "@bitwarden/vault";

import { SharedModule } from "../../shared";

/**
 * Enum representing the possible results of the password generator dialog.
 */
export enum PasswordGeneratorResult {
  Added = "added",
  Closed = "closed",
}

/**
 * Interface representing the result of the password generator dialog.
 */
export interface PasswordGeneratorCloseResult {
  action: PasswordGeneratorResult;
  password?: string;
}

/**
 * Interface representing the parameters passed to the password generator dialog.
 */
export interface PasswordGeneratorParams {}

/**
 * Component for the password generator dialog.
 */
@Component({
  selector: "app-vault-password-generator",
  templateUrl: "password-generator.component.html",
  standalone: true,
  imports: [CommonModule, SharedModule, CipherFormGeneratorComponent],
})
export class PasswordGeneratorComponent {
  /**
   * Constructor for PasswordGeneratorComponent.
   * @param dialogRef - Reference to the dialog.
   * @param params - Parameters passed to the dialog.
   */
  constructor(
    private dialogRef: DialogRef<PasswordGeneratorCloseResult>,
    @Inject(DIALOG_DATA) public params: PasswordGeneratorParams,
  ) {}

  /**
   * The generated password.
   */
  password: string | null = null;

  /**
   * Called when a password is generated.
   * @param password - The generated password.
   */
  passwordGenerated(password: string) {
    this.password = password;
  }

  /**
   * Called when a password is successfully added.
   * Closes the dialog with an 'added' result.
   */
  passwordAdded() {
    this.dialogRef.close({
      action: PasswordGeneratorResult.Added,
      password: this.password,
    });
  }

  /**
   * Called when the dialog is closed without generating a password.
   * Closes the dialog with a 'closed' result.
   */
  dialogClosed() {
    this.dialogRef.close({
      action: PasswordGeneratorResult.Closed,
    });
  }
}
