import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { CustomFieldDetailed, DataForDynamicDocument } from 'app/api/models';
import { DocumentsService } from 'app/api/services/documents.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';

export type ProcessDynamicDocStep = 'form' | 'preview';

/**
 * Show a form to fill the document's custom fields and process it.
 */
@Component({
  selector: 'process-dynamic-document',
  templateUrl: 'process-dynamic-document.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessDynamicDocumentComponent extends BasePageComponent<DataForDynamicDocument> implements OnInit {
  step$ = new BehaviorSubject<ProcessDynamicDocStep>(null);

  form: FormGroup;
  result$ = new BehaviorSubject<string>(null);
  formFields: CustomFieldDetailed[];
  documentId: string;

  get result(): string {
    return this.result$.value;
  }

  get step(): ProcessDynamicDocStep {
    return this.step$.value;
  }
  set step(step: ProcessDynamicDocStep) {
    this.step$.next(step);
  }

  constructor(
    injector: Injector,
    private fieldsHelper: FieldHelperService,
    private documentsService: DocumentsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const route = this.route.snapshot;
    this.documentId = route.params.id;

    this.addSub(
      this.documentsService.getDataForDynamicDocument({ id: this.documentId, user: ApiHelper.SELF }).subscribe(data => {
        this.data = data;
      })
    );
  }

  onDataInitialized(data: DataForDynamicDocument) {
    this.formFields = data.formFields || [];
    this.form = this.fieldsHelper.customValuesFormGroup(this.formFields);
    if (this.formFields.length > 0) {
      this.step = 'form';
    } else {
      this.process();
    }
  }

  process() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    this.addSub(
      this.documentsService
        .processDynamicDocument({
          id: this.documentId,
          user: ApiHelper.SELF,
          body: { formFields: this.form.value }
        })
        .subscribe(data => {
          this.result$.next(data);
          // Heading actions
          const headingActions: HeadingAction[] = [];
          headingActions.push(this.exportHelper.printAction());
          headingActions[0].maybeRoot = true;
          this.headingActions = headingActions;
          this.step = 'preview';
        })
    );
  }

  formControl(internalName: string): AbstractControl {
    return this.form.get(internalName);
  }

  resolveMenu() {
    return this.menu.userMenu(null, Menu.MY_DOCUMENTS);
  }
}
