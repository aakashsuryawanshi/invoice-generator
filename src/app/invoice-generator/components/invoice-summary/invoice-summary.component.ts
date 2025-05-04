import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { InvoiceService } from '../../services/invoice.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-invoice-summary',
  templateUrl: './invoice-summary.component.html',
  styleUrls: ['./invoice-summary.component.css']
})
export class InvoiceSummaryComponent implements OnInit, OnDestroy {
  @Input() subtotal: number = 0;
  
  taxRate: number = 0;
  discountRate: number = 0;
  shippingAmount: number = 0;
  amountPaid: number = 0;
  
  taxAmount: number = 0;
  discountAmount: number = 0;
  total: number = 0;
  balanceDue: number = 0;
  
  currency: string = 'USD';
  
  showTax: boolean = false;
  showDiscount: boolean = false;
  showShipping: boolean = false;

  // Track if toggle was explicitly set by user
  private userToggledTax: boolean = false;
  private userToggledDiscount: boolean = false;
  private userToggledShipping: boolean = false;
  
  private subscription: Subscription = new Subscription();

  constructor(private invoiceService: InvoiceService) { }

  ngOnInit(): void {
    this.subscription = this.invoiceService.invoiceData$.subscribe(data => {
      this.taxRate = data.taxRate;
      this.taxAmount = data.taxAmount;
      this.discountRate = data.discountRate;
      this.discountAmount = data.discountAmount;
      this.shippingAmount = data.shippingAmount;
      this.amountPaid = data.amountPaid;
      this.total = data.total;
      this.balanceDue = data.balanceDue;
      this.currency = data.currency;
      
      // Only update visibility if user hasn't explicitly toggled
      if (!this.userToggledTax) {
        this.showTax = this.taxRate > 0;
      }
      
      if (!this.userToggledDiscount) {
        this.showDiscount = this.discountRate > 0;
      }
      
      if (!this.userToggledShipping) {
        this.showShipping = this.shippingAmount > 0;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  updateTaxRate(rate: number): void {
    this.taxRate = rate;
    this.invoiceService.updateInvoiceData({ taxRate: rate });
  }

  updateDiscountRate(rate: number): void {
    this.discountRate = rate;
    this.invoiceService.updateInvoiceData({ discountRate: rate });
  }

  updateShippingAmount(amount: number): void {
    this.shippingAmount = amount;
    this.invoiceService.updateInvoiceData({ shippingAmount: amount });
  }

  updateAmountPaid(amount: number): void {
    this.amountPaid = amount;
    this.invoiceService.updateInvoiceData({ amountPaid: amount });
  }
  
  toggleTax(): void {
    this.userToggledTax = true;
    this.showTax = !this.showTax;
    if (!this.showTax) {
      this.taxRate = 0;
      this.updateTaxRate(0);
    }
  }
  
  toggleDiscount(): void {
    this.userToggledDiscount = true;
    this.showDiscount = !this.showDiscount;
    if (!this.showDiscount) {
      this.discountRate = 0;
      this.updateDiscountRate(0);
    }
  }
  
  toggleShipping(): void {
    this.userToggledShipping = true;
    this.showShipping = !this.showShipping;
    if (!this.showShipping) {
      this.shippingAmount = 0;
      this.updateShippingAmount(0);
    }
  }
}
