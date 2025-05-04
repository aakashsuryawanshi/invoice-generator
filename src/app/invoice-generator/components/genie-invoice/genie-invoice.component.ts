import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-genie-invoice',
  templateUrl: './genie-invoice.component.html',
  styleUrls: ['./genie-invoice.component.css']
})
export class GenieInvoiceComponent {
  userPrompt: string = '';
  isGenerating: boolean = false;
  generatedInvoice: boolean = false;
  pdfSrc: SafeResourceUrl;
  
  constructor(private sanitizer: DomSanitizer) {
    this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl('/assets/invoice.pdf');
  }
  
  generateInvoice(): void {
    if (!this.userPrompt.trim()) {
      return;
    }
    
    this.isGenerating = true;
    
    // Simulate API call with timeout
    setTimeout(() => {
      this.isGenerating = false;
      this.generatedInvoice = true;
    }, 2000);
  }
  
  downloadInvoice(): void {
    const link = document.createElement('a');
    link.href = '/assets/invoice.pdf';
    link.download = 'invoice.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
