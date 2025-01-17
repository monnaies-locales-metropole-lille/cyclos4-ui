import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { BrokerDataForAdd, RoleEnum } from 'app/api/models';
import { BrokeringService } from 'app/api/services/brokering.service';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';

/**
 * Assigns a broker to an user
 */
@Component({
  selector: 'broker-form',
  templateUrl: 'broker-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrokerFormComponent extends BasePageComponent<BrokerDataForAdd> implements OnInit {
  id: string;
  user: string;
  form: FormGroup;
  userQuery: any;

  constructor(injector: Injector, private brokeringService: BrokeringService) {
    super(injector);
    this.form = this.formBuilder.group({});
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(
      this.brokeringService.getBrokerDataForAdd({ user: this.user }).subscribe(data => {
        this.data = data;
      })
    );
  }

  onDataInitialized(data: BrokerDataForAdd) {
    this.userQuery = {
      roles: [RoleEnum.BROKER],
      usersToExclude: data.brokers.map(b => b.id),
      groups: data.brokerGroups.map(g => g.id)
    };
    if (data.brokers) {
      this.form.setControl('mainBroker', this.formBuilder.control(false));
    }
    this.form.setControl('broker', this.formBuilder.control(null, Validators.required));
  }

  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const value = this.form.value;
    this.addSub(
      this.brokeringService
        .addBroker({
          broker: value.broker,
          user: this.user,
          main: value.mainBroker
        })
        .subscribe(() => {
          this.notification.snackBar(this.i18n.brokers.brokerAdded);
          if (this.breadcrumb.breadcrumb$.value.length > 1) {
            // If coming from the brokers list then go back
            this.breadcrumb.back();
          } else {
            // Else if you has done a F5 or comes from a link, go to the brokers list and remove this page from the history
            this.breadcrumb.pop();
            this.router.navigate(['/users', this.user, 'brokers'], { replaceUrl: true });
          }
        })
    );
  }

  resolveMenu() {
    return this.menu.searchUsersMenu();
  }
}
