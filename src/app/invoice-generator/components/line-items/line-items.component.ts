import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { InvoiceService, LineItem } from '../../services/invoice.service';

@Component({
  selector: 'app-line-items',
  templateUrl: './line-items.component.html',
  styleUrls: ['./line-items.component.css']
})
export class LineItemsComponent implements OnInit {
  @Input() currency: string = 'USD';
  @Output() totalChanged = new EventEmitter<number>();
  
  lineItems: LineItem[] = [];

  constructor(private invoiceService: InvoiceService) { }

  ngOnInit(): void {
    // Subscribe to the invoice data to get any initial line items
    this.invoiceService.invoiceData$.subscribe(data => {
      // Only update local array if it's empty (first load) or if we received line items from service
      if (this.lineItems.length === 0 || data.lineItems.length > 0) {
        this.lineItems = [...data.lineItems];
      }
      
      this.currency = data.currency;
    });
    
    // Initialize with one empty line item if we don't have any
    if (this.lineItems.length === 0) {
      this.addLineItem();
    }
  }

  addLineItem(): void {
    this.lineItems.push({
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    });
    
    // Update the service with the new line items
    this.invoiceService.updateLineItems([...this.lineItems]);
    
    // Calculate and emit the updated subtotal
    this.calculateAndEmitSubtotal();
  }

  deleteLineItem(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems.splice(index, 1);
      // Update the service with the modified line items
      this.invoiceService.updateLineItems([...this.lineItems]);
      
      // Calculate and emit the updated subtotal
      this.calculateAndEmitSubtotal();
    }
  }

  calculateLineItemAmount(item: LineItem): void {
    item.amount = parseFloat((item.quantity * item.rate).toFixed(2));
    // Update the service with the modified line items
    this.invoiceService.updateLineItems([...this.lineItems]);
    
    // Calculate and emit the updated subtotal
    this.calculateAndEmitSubtotal();
  }
  
  private calculateAndEmitSubtotal(): void {
    const subtotal = this.lineItems.reduce((sum, item) => sum + item.amount, 0);
    this.totalChanged.emit(subtotal);
  }
}
