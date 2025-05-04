import { Routes } from '@angular/router';
import { InvoiceGeneratorComponent } from './invoice-generator/components/invoice-generator/invoice-generator.component';
import { GenieInvoiceComponent } from './invoice-generator/components/genie-invoice/genie-invoice.component';

export const routes: Routes = [
  { path: '', component: InvoiceGeneratorComponent },
  { path: 'genie-invoice', component: GenieInvoiceComponent },
  { path: '**', redirectTo: '' }
];
