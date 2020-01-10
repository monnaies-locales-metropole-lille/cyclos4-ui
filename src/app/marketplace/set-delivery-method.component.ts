import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Output, Input, OnInit } from '@angular/core';
import { Validators, FormGroup } from '@angular/forms';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Currency, TimeInterval, SetDeliveryMethod } from 'app/api/models';

/**
 * A component which allows to specify a delivery method (name, charge amount, remarks, min and max delivery time)
 */
@Component({
  selector: 'set-delivery-method',
  templateUrl: 'set-delivery-method.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetDeliveryMethodComponent extends BaseComponent implements OnInit {

  @Input() name: string;
  @Input() chargeAmount: number;
  @Input() minTime: TimeInterval;
  @Input() maxTime: TimeInterval;
  @Input() currency: Currency;
  @Output() done = new EventEmitter<SetDeliveryMethod>();

  form: FormGroup;

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
  ) {
    super(injector);
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      name: [this.name, Validators.required],
      chargeAmount: [this.chargeAmount, Validators.required],
      minTime: this.minTime,
      maxTime: [this.maxTime, Validators.required],
      remarks: ''
    });
  }

  submit() {
    this.done.emit(this.form.value);
    this.modalRef.hide();
  }

}
