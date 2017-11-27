import { ChangeDetectorRef } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { PaginationData } from 'app/shared/pagination-data';
import { HttpResponse } from '@angular/common/http';
import { Subscription } from 'rxjs/Subscription';

/**
 * Simple implementation for a DataSource to be used on data tables.
 * Delegates the data to a BehaviorSubject which holds the data array.
 * Also holds the pagination data.
 */
export class TableDataSource<T> extends DataSource<T> {

  /**
   * Holds the datasource data
   */
  data = new BehaviorSubject<T[]>([]);

  /**
   * Holds the pagination data
   */
  pagination = new BehaviorSubject<PaginationData>(null);

  /**
   * Observable indicating empty data
   */
  empty = new BehaviorSubject<boolean>(true);

  /**
   * Subscription to the last subscribed observable
   */
  private subscription: Subscription;

  /**
   * Subscribes to the given Observable, updating the data accordingly
   * @param data The new data array
   */
  subscribe(data$: Observable<HttpResponse<T[]>> | Observable<T[]>): void {
    this.unsubscribe();

    this.subscription = (<Observable<any>>data$).subscribe(res => {
      if (res instanceof HttpResponse) {
        this.data.next(res.body);
        this.pagination.next(PaginationData.from(res));
      } else {
        this.data.next(res);
        this.pagination.next(null);
      }
    });
  }

  /**
   * Sets the raw data, with no pagination information
   * @param data The raw data
   */
  next(data: T[]): void {
    this.data.next(data);
    this.pagination.next(null);
  }

  private unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  constructor() {
    super();
    this.data.subscribe(arr => this.empty.next(arr == null || arr.length === 0));
  }

  connect(): Observable<T[]> {
    return this.data;
  }

  disconnect(): void {
    this.unsubscribe();
  }
}
