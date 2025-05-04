import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  fromAddress: string;
  billTo: string;
  shipTo: string;
  date: string;
  paymentTerms: string;
  dueDate: string;
  poNumber: string;
  logoUrl: string | null;
  notes: string;
  terms: string;
  currency: string;
  currencySymbol: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly _defaultCurrency = 'USD';
  private readonly _defaultCurrencySymbol = '$';
  private readonly _storageKey = 'invoiceDefaults';
  private readonly _hasStorage: boolean;
  
  private _invoiceDataSource = new BehaviorSubject<InvoiceData>({
    invoiceNumber: '1',
    fromAddress: '',
    billTo: '',
    shipTo: '',
    date: '',
    paymentTerms: '',
    dueDate: '',
    poNumber: '',
    logoUrl: null,
    notes: '',
    terms: '',
    currency: this._defaultCurrency,
    currencySymbol: this._defaultCurrencySymbol,
    lineItems: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discountRate: 0,
    discountAmount: 0,
    shippingAmount: 0,
    total: 0,
    amountPaid: 0,
    balanceDue: 0
  });

  invoiceData$: Observable<InvoiceData> = this._invoiceDataSource.asObservable();

  // Currency options that can be used across components
  currencies = [
    { code: 'USD', symbol: '$', name: 'USD ($)' },
    { code: 'EUR', symbol: '€', name: 'EUR (€)' },
    { code: 'GBP', symbol: '£', name: 'GBP (£)' },
    { code: 'CAD', symbol: '$', name: 'CAD ($)' },
    { code: 'AUD', symbol: '$', name: 'AUD ($)' },
    { code: 'INR', symbol: '₹', name: 'INR (₹)' },
    { code: 'JPY', symbol: '¥', name: 'JPY (¥)' }
  ];
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {
    // Initialize storage availability flag
    this._hasStorage = this.checkStorageAvailability();
    
    // Safe initialization of browser-specific features
    if (isPlatformBrowser(this.platformId)) {
      // Use NgZone.runOutsideAngular to avoid unnecessary change detection
      this.ngZone.runOutsideAngular(() => {
        // Defer localStorage access until next event loop
        setTimeout(() => {
          try {
            this.loadDefaultSettings();
          } catch (error) {
            console.error('Failed to load invoice defaults:', error);
          }
        }, 0);
      });
    }
  }

  getInvoiceData(): InvoiceData {
    return this._invoiceDataSource.value;
  }

  updateInvoiceData(data: Partial<InvoiceData>, skipRecalculate: boolean = false): void {
    this._invoiceDataSource.next({
      ...this._invoiceDataSource.value,
      ...data
    });
    
    // Recalculate totals when data changes unless explicitly skipped
    if (!skipRecalculate) {
      this.recalculateTotals();
    }
  }

  updateLineItems(lineItems: LineItem[], skipRecalculate: boolean = false): void {
    this._invoiceDataSource.next({
      ...this._invoiceDataSource.value,
      lineItems
    });
    
    if (!skipRecalculate) {
      this.recalculateTotals();
    }
  }

  // Batch update method to handle multiple changes at once
  batchUpdate(updates: {
    lineItems?: LineItem[],
    subtotal?: number,
    taxRate?: number,
    discountRate?: number,
    shippingAmount?: number,
    amountPaid?: number,
    otherData?: Partial<InvoiceData>
  }): void {
    const currentData = this._invoiceDataSource.value;
    let newData = { ...currentData };
    
    // Apply line items if provided
    if (updates.lineItems) {
      newData.lineItems = updates.lineItems;
      
      // Calculate subtotal from line items if not explicitly provided
      if (!updates.subtotal) {
        updates.subtotal = updates.lineItems.reduce((sum, item) => sum + item.amount, 0);
      }
    }
    
    // Apply direct subtotal update if provided
    const subtotal = updates.subtotal !== undefined ? updates.subtotal : currentData.subtotal;
    
    // Apply tax and discount rates if provided
    const taxRate = updates.taxRate !== undefined ? updates.taxRate : currentData.taxRate;
    const discountRate = updates.discountRate !== undefined ? updates.discountRate : currentData.discountRate;
    
    // Calculate tax and discount amounts
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = subtotal * (discountRate / 100);
    
    // Apply shipping and amount paid if provided
    const shippingAmount = updates.shippingAmount !== undefined ? updates.shippingAmount : currentData.shippingAmount;
    const amountPaid = updates.amountPaid !== undefined ? updates.amountPaid : currentData.amountPaid;
    
    // Calculate total and balance due
    const total = subtotal + taxAmount - discountAmount + shippingAmount;
    const balanceDue = total - amountPaid;
    
    // Build final update object
    const finalUpdate = {
      ...updates.otherData,
      subtotal,
      taxRate,
      taxAmount,
      discountRate,
      discountAmount,
      shippingAmount,
      amountPaid,
      total,
      balanceDue
    };
    
    // Update the data source with all changes at once
    this._invoiceDataSource.next({
      ...newData,
      ...finalUpdate
    });
  }

  updateCurrency(currencyCode: string): void {
    const currency = this.currencies.find(c => c.code === currencyCode);
    if (currency) {
      this._invoiceDataSource.next({
        ...this._invoiceDataSource.value,
        currency: currencyCode,
        currencySymbol: currency.symbol
      });
    }
  }

  updateSubtotal(subtotal: number): void {
    const currentData = this._invoiceDataSource.value;
    
    // Calculate tax and discount amounts
    const taxAmount = subtotal * (currentData.taxRate / 100);
    const discountAmount = subtotal * (currentData.discountRate / 100);
    
    // Calculate total and balance due
    const total = subtotal + taxAmount - discountAmount + currentData.shippingAmount;
    const balanceDue = total - currentData.amountPaid;
    
    this._invoiceDataSource.next({
      ...currentData,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      balanceDue
    });
  }

  private recalculateTotals(): void {
    const currentData = this._invoiceDataSource.value;
    
    // Calculate subtotal from line items
    const subtotal = currentData.lineItems.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate tax and discount amounts
    const taxAmount = subtotal * (currentData.taxRate / 100);
    const discountAmount = subtotal * (currentData.discountRate / 100);
    
    // Calculate total and balance due
    const total = subtotal + taxAmount - discountAmount + currentData.shippingAmount;
    const balanceDue = total - currentData.amountPaid;
    
    this._invoiceDataSource.next({
      ...currentData,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      balanceDue
    });
  }

  saveAsDefault(): void {
    if (!this._hasStorage) {
      return;
    }
    
    try {
      const currentData = this._invoiceDataSource.value;
      const defaultSettings = {
        currency: currentData.currency,
        fromAddress: currentData.fromAddress,
        terms: currentData.terms
      };
      
      // Run storage operations outside Angular zone for performance
      this.ngZone.runOutsideAngular(() => {
        this.safeLocalStorageOperation(() => {
          localStorage.setItem(this._storageKey, JSON.stringify(defaultSettings));
        });
      });
    } catch (error) {
      console.error('Failed to save invoice defaults:', error);
    }
  }

  private loadDefaultSettings(): void {
    if (!this._hasStorage) {
      return;
    }
    
    let defaultSettingsJson: string | null = null;
    
    // First safely retrieve the value from localStorage
    try {
      defaultSettingsJson = this.safeLocalStorageOperation(() => {
        return localStorage.getItem(this._storageKey);
      });
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return;
    }
    
    // Then safely parse and apply settings if available
    if (defaultSettingsJson) {
      try {
        const defaultSettings = JSON.parse(defaultSettingsJson);
        
        // Run state updates inside Angular zone
        this.ngZone.run(() => {
          this._invoiceDataSource.next({
            ...this._invoiceDataSource.value,
            currency: defaultSettings.currency || this._defaultCurrency,
            fromAddress: defaultSettings.fromAddress || '',
            terms: defaultSettings.terms || ''
          });
          
          // If currency is specified, update the currency symbol too
          if (defaultSettings.currency) {
            const currency = this.currencies.find(c => c.code === defaultSettings.currency);
            if (currency) {
              this._invoiceDataSource.next({
                ...this._invoiceDataSource.value,
                currencySymbol: currency.symbol
              });
            }
          }
        });
      } catch (parseError) {
        console.error('Failed to parse settings from localStorage:', parseError);
      }
    }
  }
  
  /**
   * Safely checks if localStorage is available in the current environment
   */
  private checkStorageAvailability(): boolean {
    // First check if we're in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    
    // Check if window is defined
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check if localStorage exists on window
    if (!('localStorage' in window)) {
      return false;
    }
    
    try {
      // Test if localStorage actually works (might be disabled by user)
      const storageTestKey = '__storage_test__';
      localStorage.setItem(storageTestKey, storageTestKey);
      const result = localStorage.getItem(storageTestKey);
      localStorage.removeItem(storageTestKey);
      return result === storageTestKey;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Safely executes localStorage operations with proper error handling
   * @param operation Function that contains localStorage operations
   * @returns Result of the operation or null if failed
   */
  private safeLocalStorageOperation<T>(operation: () => T): T | null {
    if (!this._hasStorage) {
      return null;
    }
    
    try {
      return operation();
    } catch (error) {
      console.error('localStorage operation failed:', error);
      return null;
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDefaultDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Default due date: 30 days from now
    return dueDate;
  }
}
