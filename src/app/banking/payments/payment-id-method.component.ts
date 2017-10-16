import { Component, Injector, Provider, forwardRef, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { DataForTransaction, PrincipalTypeInput, IdentificationMethodEnum } from "app/api/models";
import { PaymentsService } from "app/api/services";
import { IdMethod } from "app/banking/payments/id-method";

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PAYMENT_ID_METHOD_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PaymentIdMethodComponent),
  multi: true
};

/**
 * Provides the selection of the identification method used to select the user
 */
@Component({
  selector: 'payment-id-method',
  templateUrl: 'payment-id-method.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PAYMENT_ID_METHOD_VALUE_ACCESSOR]
})
export class PaymentIdMethodComponent extends BaseBankingComponent implements ControlValueAccessor {
  constructor(injector: Injector) {
    super(injector);
  }

  private _value: IdMethod
  get value(): IdMethod {
    return this._value;
  }
  set value(val: IdMethod) {
    this._value = val;
    this.changeCallback(val);
  }

  @Input()
  dataForPayment: DataForTransaction;

  @Input()
  allowedIdMethods: IdMethod[];

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };

  writeValue(obj: any): void {
    this.value = obj
  }
  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }
  setDisabledState(isDisabled: boolean): void {
  }
}