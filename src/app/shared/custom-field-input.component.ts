import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Host,
  Injector,
  Input,
  OnInit,
  Optional,
  Output,
  SkipSelf,
  ViewChild
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import {
  CustomFieldBinaryValues,
  CustomFieldControlEnum,
  CustomFieldDetailed,
  CustomFieldTypeEnum,
  Image,
  LinkedEntityTypeEnum,
  StoredFile,
  UserQueryFilters,
  UserStatusEnum
} from 'app/api/models';
import { FieldHelperService } from 'app/core/field-helper.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { BooleanFieldComponent } from 'app/shared/boolean-field.component';
import { CheckboxGroupFieldComponent } from 'app/shared/checkbox-group-field.component';
import { DateFieldComponent } from 'app/shared/date-field.component';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';
import { FieldOption } from 'app/shared/field-option';
import { FilesFieldComponent } from 'app/shared/files-field.component';
import { empty, focus, truthyAttr } from 'app/shared/helper';
import { HtmlFieldComponent } from 'app/shared/html-field.component';
import { ImagesFieldComponent } from 'app/shared/images-field.component';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { Mask } from 'app/shared/mask';
import { MultiSelectionFieldComponent } from 'app/shared/multi-selection-field.component';
import { RadioGroupFieldComponent } from 'app/shared/radio-group-field.component';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';
import { TextAreaFieldComponent } from 'app/shared/textarea-field.component';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { first } from 'rxjs/operators';

const INPUT_TYPES = [CustomFieldTypeEnum.STRING, CustomFieldTypeEnum.INTEGER, CustomFieldTypeEnum.LINKED_ENTITY];
const ENUMERATED = [CustomFieldTypeEnum.SINGLE_SELECTION, CustomFieldTypeEnum.MULTI_SELECTION];

/**
 * Component used to edit a custom field value
 */
@Component({
  selector: 'custom-field-input',
  templateUrl: 'custom-field-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: CustomFieldInputComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: CustomFieldInputComponent, multi: true }
  ]
})
export class CustomFieldInputComponent extends BaseFormFieldComponent<string> implements Validator, OnInit {
  private _field: CustomFieldDetailed;
  @Input() get field(): CustomFieldDetailed {
    return this._field;
  }
  set field(field: CustomFieldDetailed) {
    this._field = field;
    if (field) {
      this.type = this.field.type;
      this.control = this.field.control;
      this.linkedEntityType = this.type === CustomFieldTypeEnum.LINKED_ENTITY ? this.field.linkedEntityType : null;
      this.fieldOptions = this.fieldHelper.fieldOptions(field);

      // Set the BaseFormField inputs
      this._id = field.internalName;
      this.name = field.internalName;
      if (!this.hideLabel) {
        this.label = field.name;
      }
      this.fieldSize = this.fieldHelper.fieldSize(field);
      this.required = field.required;
    }
  }
  @Input() focused: boolean | string;
  @Input() autocomplete = 'off';
  @Input() submitAction: () => void;

  @Output() imagesUploaded = new EventEmitter<Image[]>();
  @Output() filesUploaded = new EventEmitter<StoredFile[]>();

  type: CustomFieldTypeEnum;
  linkedEntityType: LinkedEntityTypeEnum;
  control: CustomFieldControlEnum;
  fieldOptions: FieldOption[];

  disabledValueObject: any;

  @ViewChild('inputField') inputField: InputFieldComponent;
  @ViewChild('textareaField') textareaField: TextAreaFieldComponent;
  @ViewChild('richTextField') richTextField: HtmlFieldComponent;
  @ViewChild('dateField') dateField: DateFieldComponent;
  @ViewChild('decimalField') decimalField: DecimalFieldComponent;
  @ViewChild('booleanField') booleanField: BooleanFieldComponent;
  @ViewChild('singleSelectionField') singleSelectionField: SingleSelectionFieldComponent;
  @ViewChild('multiSelectionField') multiSelectionField: MultiSelectionFieldComponent;
  @ViewChild('checkboxGroupField') checkboxGroupField: CheckboxGroupFieldComponent;
  @ViewChild('radioGroupField') radioGroupField: RadioGroupFieldComponent;
  @ViewChild('imagesField') imagesField: ImagesFieldComponent;
  @ViewChild('filesField') filesField: FilesFieldComponent;
  @ViewChild('userField') userField: UserFieldComponent;

  _hideLabel: boolean | string = false;
  @Input() get hideLabel(): boolean | string {
    return this._hideLabel;
  }
  set hideLabel(hideLabel: boolean | string) {
    this._hideLabel = truthyAttr(hideLabel);
    if (this._hideLabel) {
      this.label = null;
    }
  }

  _hideInformationText: boolean | string = false;
  @Input() get hideInformationText(): boolean | string {
    return this._hideInformationText;
  }
  set hideInformationText(hideInformationText: boolean | string) {
    this._hideInformationText = truthyAttr(hideInformationText);
  }

  @Input() binaryValues: CustomFieldBinaryValues;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private fieldHelper: FieldHelperService,
    private modal: BsModalService
  ) {
    super(injector, controlContainer);
  }

  preprocessValue(value: any): string {
    if (empty(value)) {
      return '';
    }
    if ([CustomFieldTypeEnum.DYNAMIC_SELECTION, CustomFieldTypeEnum.LINKED_ENTITY].includes(this.type)) {
      // Both dynamic and linked entities can have a separator between value and text. Keep only the value.
      return value.split(ApiHelper.VALUE_SEPARATOR)[0];
    }
    return value;
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.field.internalName;

    // When disabled, we always use a <format-field-value> component
    this.disabledFormat = 'component';

    // When disabled, set a value suitable for the format-field-value component
    if (this.formControl.disabled) {
      this.disabledValueObject = {
        customValues: {}
      };
      this.disabledValueObject.customValues[this.field.internalName] = this.formControl.value;
    }
  }

  get hasValuesList(): boolean {
    // Don't handle enumerated as with values list because they are already rendered correctly, and have categories
    return (
      this.field.hasValuesList &&
      !ENUMERATED.includes(this.type) &&
      this.type !== CustomFieldTypeEnum.DYNAMIC_MULTI_SELECTION
    );
  }

  get valueAsArray(): string[] {
    return (this.value || '').split(ApiHelper.VALUE_SEPARATOR);
  }

  set valueAsArray(value: string[]) {
    this.value = (value || []).join(ApiHelper.VALUE_SEPARATOR);
  }

  get input(): boolean {
    return INPUT_TYPES.includes(this.type) && this.linkedEntityType !== LinkedEntityTypeEnum.USER;
  }

  userSearchFilters(): UserQueryFilters {
    return { statuses: [UserStatusEnum.ACTIVE, UserStatusEnum.BLOCKED, UserStatusEnum.DISABLED] };
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    if (this.field.type === CustomFieldTypeEnum.DATE && this.dateField) {
      return this.dateField.validate(c);
    }
    return null;
  }

  showScanQrCode() {
    const ref = this.modal.show(ScanQrCodeComponent, { class: 'modal-form' });
    const component = ref.content as ScanQrCodeComponent;
    component.select.pipe(first()).subscribe(value => {
      if (value) {
        if (this.field.pattern) {
          value = new Mask(this.field.pattern).apply(value);
        }
        this.formControl.setValue(value);
        if (this.field.automaticallyProcessAfterScan && this.submitAction) {
          this.submitAction();
        }
      }
    });
    this.modal.onHide.pipe(first()).subscribe(() => focus(this.inputField, true));
  }

  protected getFocusableControl() {
    return [
      this.inputField,
      this.textareaField,
      this.richTextField,
      this.dateField,
      this.decimalField,
      this.booleanField,
      this.singleSelectionField,
      this.multiSelectionField,
      this.checkboxGroupField,
      this.radioGroupField,
      this.imagesField,
      this.filesField,
      this.userField
    ].find(c => c != null);
  }

  getInformationText(): string {
    return this.hideInformationText ? '' : this.field.informationText;
  }

  protected getDisabledValue(): string {
    // Never used, because we alway set disabledFormat to component
    return null;
  }
}
