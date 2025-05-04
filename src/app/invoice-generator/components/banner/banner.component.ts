import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent implements OnInit {
  isCollapsed = false;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }
    
    try {
      // Check if user has dismissed banner before
      const bannerState = localStorage.getItem('invoiceBannerState');
      this.isCollapsed = bannerState === 'collapsed';
    } catch (error) {
      console.error('Error accessing banner state:', error);
      // Default to showing banner
      this.isCollapsed = false;
    }
  }

  toggleBanner(): void {
    this.isCollapsed = !this.isCollapsed;
    
    if (this.isBrowser) {
      try {
        localStorage.setItem('invoiceBannerState', this.isCollapsed ? 'collapsed' : 'expanded');
      } catch (error) {
        console.error('Error saving banner state:', error);
      }
    }
  }
}
