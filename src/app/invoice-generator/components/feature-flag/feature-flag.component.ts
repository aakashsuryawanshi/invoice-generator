import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-feature-flag',
  templateUrl: './feature-flag.component.html',
  styleUrls: ['./feature-flag.component.css']
})
export class FeatureFlagComponent {
  @Input() text: string = 'NEW';
  @Input() type: 'new' | 'beta' | 'coming-soon' = 'new';
  @Input() position: 'top-right' | 'top-left' | 'inline' = 'top-right';
}
