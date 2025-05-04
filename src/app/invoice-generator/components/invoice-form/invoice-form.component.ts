import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { InvoiceService, LineItem } from '../../services/invoice.service';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-invoice-form',
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit, OnDestroy {
  invoiceForm!: FormGroup;
  selectedCurrency: string = 'USD';
  currencySymbol: string = '$';
  invoiceSubtotal: number = 0;
  logoFile: File | null = null;
  
  // Direct reference to service currencies for the dropdown
  currencies: { code: string; symbol: string; name: string }[] = [];
  
  private formSubscription: Subscription = new Subscription();
  private invoiceSubscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService
  ) {
    this.currencies = this.invoiceService.currencies;
  }

  ngOnInit(): void {
    this.initForm();
    
    // Subscribe to invoice data changes from the service
    this.invoiceSubscription = this.invoiceService.invoiceData$.subscribe(data => {
      // Only update the form values if they're different to avoid recursion
      if (
        this.invoiceForm.get('invoiceNumber')?.value !== data.invoiceNumber ||
        this.invoiceForm.get('fromAddress')?.value !== data.fromAddress ||
        this.invoiceForm.get('billTo')?.value !== data.billTo ||
        this.invoiceForm.get('shipTo')?.value !== data.shipTo ||
        this.invoiceForm.get('date')?.value !== data.date ||
        this.invoiceForm.get('paymentTerms')?.value !== data.paymentTerms ||
        this.invoiceForm.get('dueDate')?.value !== data.dueDate ||
        this.invoiceForm.get('poNumber')?.value !== data.poNumber ||
        this.invoiceForm.get('logoUrl')?.value !== data.logoUrl ||
        this.invoiceForm.get('notes')?.value !== data.notes ||
        this.invoiceForm.get('terms')?.value !== data.terms
      ) {
        this.invoiceForm.patchValue({
          invoiceNumber: data.invoiceNumber,
          fromAddress: data.fromAddress,
          billTo: data.billTo,
          shipTo: data.shipTo,
          date: data.date,
          paymentTerms: data.paymentTerms,
          dueDate: data.dueDate,
          poNumber: data.poNumber,
          logoUrl: data.logoUrl,
          notes: data.notes,
          terms: data.terms
        }, { emitEvent: false });
      }
      
      // Update line items if there are any in the data
      if (data.lineItems && data.lineItems.length > 0 && this.lineItemsFormArray.length === 0) {
        this.updateLineItemsFormArray(data.lineItems);
      }
      
      this.selectedCurrency = data.currency;
      this.currencySymbol = data.currencySymbol;
      this.invoiceSubtotal = data.subtotal;
    });
  }

  ngOnDestroy(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    if (this.invoiceSubscription) {
      this.invoiceSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.invoiceForm = this.fb.group({
      invoiceNumber: ['1', Validators.required],
      fromAddress: ['', Validators.required],
      billTo: ['', Validators.required],
      shipTo: [''],
      date: [''],
      paymentTerms: [''],
      dueDate: [''],
      poNumber: [''],
      logoUrl: [null],
      notes: [''],
      terms: [''],
      lineItems: this.fb.array([this.createLineItemFormGroup()]) // Initialize with one empty line item
    });
    
    // Listen to form value changes and update the service
    this.formSubscription = this.invoiceForm.valueChanges
      .pipe(debounceTime(300)) // Debounce to avoid too many updates
      .subscribe(formValue => {
        // Calculate total before updating service
        this.calculateInvoiceTotal();
        this.invoiceService.updateInvoiceData(formValue);
      });
  }

  // Helper method to get the line items form array
  get lineItemsFormArray(): FormArray {
    return this.invoiceForm.get('lineItems') as FormArray;
  }

  // Create a form group for a new line item
  createLineItemFormGroup(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      rate: [0, [Validators.required, Validators.min(0)]],
      amount: [{value: 0, disabled: true}]
    });
  }

  // Add a new line item
  addLineItem(): void {
    this.lineItemsFormArray.push(this.createLineItemFormGroup());
    this.calculateInvoiceTotal();
  }

  // Remove line item at specified index
  removeLineItem(index: number): void {
    if (this.lineItemsFormArray.length > 1) {
      this.lineItemsFormArray.removeAt(index);
      this.calculateInvoiceTotal();
    }
  }

  // Add suggested line items
  suggestItems(): void {
    // Sample line items to suggest
    const suggestedItems = [
      { description: 'Web Development Services', quantity: 20, rate: 75 },
      { description: 'UI/UX Design', quantity: 10, rate: 85 },
      { description: 'Content Creation', quantity: 5, rate: 60 },
      { description: 'Technical Support', quantity: 8, rate: 45 }
    ];
    
    // Store current invoice data to preserve settings
    const currentData = this.invoiceService.getInvoiceData();
    
    // Clear existing items in form array
    while (this.lineItemsFormArray.length) {
      this.lineItemsFormArray.removeAt(0);
    }
    
    // Create line items with proper calculations
    const lineItems: LineItem[] = suggestedItems.map(item => {
      const amount = parseFloat((item.quantity * item.rate).toFixed(2));
      
      // Create form group for UI
      const lineItemGroup = this.fb.group({
        description: [item.description, Validators.required],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        rate: [item.rate, [Validators.required, Validators.min(0)]],
        amount: [{value: amount, disabled: true}]
      });
      
      this.lineItemsFormArray.push(lineItemGroup);
      
      // Return line item for service update
      return {
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: amount
      };
    });
    
    // Calculate subtotal
    const subtotal = parseFloat(lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
    this.invoiceSubtotal = subtotal;
    
    // Use batch update to ensure all values are updated atomically
    this.invoiceService.batchUpdate({
      lineItems: lineItems,
      subtotal: subtotal,
      taxRate: currentData.taxRate,
      discountRate: currentData.discountRate,
      shippingAmount: currentData.shippingAmount,
      amountPaid: currentData.amountPaid
    });
  }

  // Calculate amount for a single line item
  calculateLineItemAmount(index: number): void {
    const lineItemGroup = this.lineItemsFormArray.at(index) as FormGroup;
    const quantity = lineItemGroup.get('quantity')?.value || 0;
    const rate = lineItemGroup.get('rate')?.value || 0;
    const amount = parseFloat((quantity * rate).toFixed(2));
    
    lineItemGroup.get('amount')?.setValue(amount, {emitEvent: false});
    this.calculateInvoiceTotal();
  }

  // Calculate the total for all line items
  calculateInvoiceTotal(): void {
    let subtotal = 0;
    
    for (let i = 0; i < this.lineItemsFormArray.length; i++) {
      const lineItemGroup = this.lineItemsFormArray.at(i) as FormGroup;
      const quantity = parseFloat(lineItemGroup.get('quantity')?.value) || 0;
      const rate = parseFloat(lineItemGroup.get('rate')?.value) || 0;
      const amount = parseFloat((quantity * rate).toFixed(2));
      
      // Update the amount field
      lineItemGroup.get('amount')?.setValue(amount, {emitEvent: false});
      subtotal += amount;
    }
    
    this.invoiceSubtotal = parseFloat(subtotal.toFixed(2));
    
    // Update the service with the calculated subtotal
    this.invoiceService.updateSubtotal(this.invoiceSubtotal);
    
    // Also update line items in the service to ensure calculations are consistent
    const lineItems: LineItem[] = this.lineItemsFormArray.controls.map((control: any) => {
      const group = control as FormGroup;
      return {
        description: group.get('description')?.value || '',
        quantity: parseFloat(group.get('quantity')?.value) || 0,
        rate: parseFloat(group.get('rate')?.value) || 0,
        amount: parseFloat(group.get('amount')?.value) || 0
      };
    });
    
    this.invoiceService.updateLineItems(lineItems);
  }

  // Update line items form array from data
  updateLineItemsFormArray(lineItems: LineItem[]): void {
    // Clear existing form array
    while (this.lineItemsFormArray.length) {
      this.lineItemsFormArray.removeAt(0);
    }
    
    // Add each line item from data
    lineItems.forEach(item => {
      const lineItemGroup = this.fb.group({
        description: [item.description, Validators.required],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        rate: [item.rate, [Validators.required, Validators.min(0)]],
        amount: [{value: item.amount, disabled: true}]
      });
      
      this.lineItemsFormArray.push(lineItemGroup);
    });
    
    // If no items were added (empty data), add one empty line item
    if (this.lineItemsFormArray.length === 0) {
      this.lineItemsFormArray.push(this.createLineItemFormGroup());
    }
    
    this.calculateInvoiceTotal();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDefaultDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Default due date: 30 days from now
    return dueDate;
  }

  onCurrencyChange(currencyCode: string): void {
    this.selectedCurrency = currencyCode;
    this.invoiceService.updateCurrency(currencyCode);
  }

  onLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.logoFile = input.files[0];
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        const logoUrl = reader.result as string;
        this.invoiceForm.patchValue({ logoUrl });
      };
      reader.readAsDataURL(this.logoFile);
    }
  }

  updateSubtotal(subtotal: number): void {
    this.invoiceSubtotal = subtotal;
    this.invoiceService.updateSubtotal(subtotal);
  }

  generateInvoice(): void {
    if (this.invoiceForm.valid) {
      const invoiceData = this.invoiceService.getInvoiceData();
      console.log('Invoice data ready for submission:', invoiceData);
      
      // Generate PDF using jsPDF
      this.generatePDF(invoiceData);
    } else {
      this.markFormGroupTouched(this.invoiceForm);
    }
  }

  private generatePDF(data: any): void {
    try {
      if (!data) {
        throw new Error('Invoice data is missing');
      }

      // Create a new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 20;
      
      // Set font styles
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      
      // Add title
      doc.text("INVOICE", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;
      
      // Add logo if available
      if (data.logoUrl) {
        try {
          doc.addImage(data.logoUrl, 'JPEG', margin, yPosition, 40, 20);
          yPosition += 25;
        } catch (e) {
          console.error('Error adding logo to PDF:', e);
          // Continue without logo if there's an error
        }
      }
      
      // Reset font for content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      // Add invoice info with null checks
      doc.text(`Invoice #: ${data.invoiceNumber || 'N/A'}`, margin, yPosition);
      doc.text(`Date: ${data.date || 'N/A'}`, pageWidth - margin, yPosition, { align: "right" });
      yPosition += 10;
      
      doc.text(`Due Date: ${data.dueDate || 'N/A'}`, pageWidth - margin, yPosition, { align: "right" });
      yPosition += 10;
      
      if (data.poNumber) {
        doc.text(`PO Number: ${data.poNumber}`, pageWidth - margin, yPosition, { align: "right" });
        yPosition += 10;
      }
      
      // Add from address
      yPosition += 10;
      doc.setFont("helvetica", "bold");
      doc.text("From:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 5;
      if (data.fromAddress) {
        const fromAddressLines = data.fromAddress.split('\n');
        fromAddressLines.forEach((line: string) => {
          if (line && line.trim()) {
            doc.text(line, margin, yPosition);
            yPosition += 5;
          }
        });
      } else {
        doc.text("N/A", margin, yPosition);
        yPosition += 5;
      }
      
      // Add billing address
      yPosition += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 5;
      if (data.billTo) {
        const billToLines = data.billTo.split('\n');
        billToLines.forEach((line: string) => {
          if (line && line.trim()) {
            doc.text(line, margin, yPosition);
            yPosition += 5;
          }
        });
      } else {
        doc.text("N/A", margin, yPosition);
        yPosition += 5;
      }
      
      // Add shipping address if different
      if (data.shipTo && data.shipTo !== data.billTo) {
        yPosition += 5;
        doc.setFont("helvetica", "bold");
        const billToLines = data.billTo ? data.billTo.split('\n').filter((line: string) => line && line.trim()) : [];
        doc.text("Ship To:", margin + 90, yPosition - (5 * billToLines.length) - 10);
        doc.setFont("helvetica", "normal");
        yPosition += 5 - (5 * billToLines.length) - 10;
        const shipToLines = data.shipTo.split('\n');
        shipToLines.forEach((line: string) => {
          if (line && line.trim()) {
            doc.text(line, margin + 90, yPosition);
            yPosition += 5;
          }
        });
        yPosition += 5 * billToLines.length;
      }
      
      // Add line items table
      yPosition += 20;
      
      const tableColumn = ["Description", "Quantity", "Rate", "Amount"];
      const tableRows: any[] = [];
      
      // Add line items to table with null checks
      if (data.lineItems && Array.isArray(data.lineItems) && data.lineItems.length > 0) {
        data.lineItems.forEach((item: LineItem) => {
          if (!item) return;
          
          const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
          const rate = typeof item.rate === 'number' ? item.rate : 0;
          const amount = typeof item.amount === 'number' ? item.amount : 0;
          
          const formattedRate = `${data.currencySymbol || '$'}${rate.toFixed(2)}`;
          const formattedAmount = `${data.currencySymbol || '$'}${amount.toFixed(2)}`;
          
          tableRows.push([
            item.description || 'No description',
            quantity,
            formattedRate,
            formattedAmount
          ]);
        });
      } else {
        // Add a placeholder row if no line items
        tableRows.push(['No items', '', '', '']);
      }
      
      try {
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: yPosition,
          theme: 'striped',
          headStyles: {
            fillColor: [66, 66, 66],
            textColor: 255,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 40, halign: 'right' }
          },
          margin: { left: margin, right: margin }
        });
      } catch (tableError) {
        console.error('Error generating table:', tableError);
        // If table fails, add a simple message
        yPosition += 10;
        doc.text("Error generating invoice table", margin, yPosition);
        yPosition += 10;
      }
      
      // Get the Y position after the table
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 20;
      yPosition = finalY + 10;
      
      // Add invoice summary section with proper error handling
      const currencySymbol = data.currencySymbol || '$';
      
      // Format monetary values with proper null checks
      const formatMoney = (value: any): string => {
        if (typeof value !== 'number') return '0.00';
        return value.toFixed(2);
      };
      
      const subtotal = formatMoney(data.subtotal);
      doc.setFontSize(10);
      
      // Initialize invoice summary position at right side of page
      const summaryX = pageWidth - margin;
      let summaryY = yPosition;
      
      // Create invoice summary section
      doc.text(`Subtotal:`, summaryX - 60, summaryY);
      doc.text(`${currencySymbol}${subtotal}`, summaryX, summaryY, { align: "right" });
      summaryY += 6;
      
      // Add tax if present
      if (data.taxRate && data.taxRate > 0) {
        const taxRate = typeof data.taxRate === 'number' ? data.taxRate : 0;
        const taxAmount = formatMoney(data.taxAmount);
        doc.text(`Tax (${taxRate}%):`, summaryX - 60, summaryY);
        doc.text(`${currencySymbol}${taxAmount}`, summaryX, summaryY, { align: "right" });
        summaryY += 6;
      }
      
      // Add discount if present
      if (data.discountRate && data.discountRate > 0) {
        const discountRate = typeof data.discountRate === 'number' ? data.discountRate : 0;
        const discountAmount = formatMoney(data.discountAmount);
        doc.text(`Discount (${discountRate}%):`, summaryX - 60, summaryY);
        doc.text(`${currencySymbol}${discountAmount}`, summaryX, summaryY, { align: "right" });
        summaryY += 6;
      }
      
      // Add shipping if present
      if (data.shippingAmount && data.shippingAmount > 0) {
        const shippingAmount = formatMoney(data.shippingAmount);
        doc.text(`Shipping:`, summaryX - 60, summaryY);
        doc.text(`${currencySymbol}${shippingAmount}`, summaryX, summaryY, { align: "right" });
        summaryY += 6;
      }
      
      // Add separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(summaryX - 70, summaryY, summaryX, summaryY);
      summaryY += 6;
      
      // Add total with bold formatting
      const total = formatMoney(data.total);
      doc.setFont("helvetica", "bold");
      doc.text(`Total:`, summaryX - 60, summaryY);
      doc.text(`${currencySymbol}${total}`, summaryX, summaryY, { align: "right" });
      summaryY += 6;
      
      // Add amount paid if present
      if (data.amountPaid && data.amountPaid > 0) {
        const amountPaid = formatMoney(data.amountPaid);
        doc.setFont("helvetica", "normal");
        doc.text(`Amount Paid:`, summaryX - 60, summaryY);
        doc.text(`${currencySymbol}${amountPaid}`, summaryX, summaryY, { align: "right" });
        summaryY += 6;
        
        // Add separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(summaryX - 70, summaryY, summaryX, summaryY);
        summaryY += 6;
        
        // Add balance due with bold formatting
        const balanceDue = formatMoney(data.balanceDue);
        doc.setFont("helvetica", "bold");
        doc.text(`Balance Due:`, summaryX - 60, summaryY);
        doc.text(`${currencySymbol}${balanceDue}`, summaryX, summaryY, { align: "right" });
      }
      
      // Reset font for remaining content
      doc.setFont("helvetica", "normal");
      
      // Add notes and terms if available (positioned below the summary)
      yPosition = Math.max(summaryY + 20, yPosition + 60);
      
      if (data.notes) {
        doc.setFont("helvetica", "bold");
        doc.text("Notes:", margin, yPosition);
        doc.setFont("helvetica", "normal");
        yPosition += 5;
        doc.text(data.notes, margin, yPosition);
        yPosition += 15;
      }
      
      if (data.terms) {
        doc.setFont("helvetica", "bold");
        doc.text("Terms:", margin, yPosition);
        doc.setFont("helvetica", "normal");
        yPosition += 5;
        doc.text(data.terms, margin, yPosition);
      }
      
      // Save the PDF with a sanitized filename
      const sanitizedInvoiceNumber = (data.invoiceNumber || 'invoice').replace(/[^a-z0-9]/gi, '-');
      doc.save(`invoice-${sanitizedInvoiceNumber}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please check the console for more details.');
    }
  }

  private downloadInvoiceJson(data: any): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a download link and click it
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${data.invoiceNumber}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  saveAsDefault(): void {
    this.invoiceService.saveAsDefault();
  }
}
