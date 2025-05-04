import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InvoiceGeneratorComponent } from './components/invoice-generator/invoice-generator.component';
import { HeaderComponent } from './components/header/header.component';
import { BannerComponent } from './components/banner/banner.component';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form.component';
import { LineItemsComponent } from './components/line-items/line-items.component';
import { InvoiceSummaryComponent } from './components/invoice-summary/invoice-summary.component';
import { FooterComponent } from './components/footer/footer.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { FeatureFlagComponent } from './components/feature-flag/feature-flag.component';
import { GenieInvoiceComponent } from './components/genie-invoice/genie-invoice.component';

@NgModule({
  declarations: [
    InvoiceGeneratorComponent,
    HeaderComponent,
    BannerComponent,
    InvoiceFormComponent,
    LineItemsComponent,
    InvoiceSummaryComponent,
    FooterComponent,
    ChatbotComponent,
    FeatureFlagComponent,
    GenieInvoiceComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    InvoiceGeneratorComponent
  ]
})
export class InvoiceGeneratorModule { }
