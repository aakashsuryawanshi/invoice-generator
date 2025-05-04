import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  socialLinks = [
    { name: 'Facebook', icon: 'fab fa-facebook', url: '#' },
    { name: 'Twitter', icon: 'fab fa-twitter', url: '#' },
    { name: 'Instagram', icon: 'fab fa-instagram', url: '#' },
    { name: 'LinkedIn', icon: 'fab fa-linkedin', url: '#' }
  ];

  navigationLinks = [
    { name: 'Features', url: '#' },
    { name: 'FAQ', url: '#' },
    { name: 'Privacy', url: '#' },
    { name: 'Terms', url: '#' },
    { name: 'Contact', url: '#' }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}
