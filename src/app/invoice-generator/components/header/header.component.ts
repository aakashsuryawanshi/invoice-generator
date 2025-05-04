import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isDarkMode = false;
  showLanguageDialog = false;
  selectedLanguage = 'English';
  
  languages = [
    'Dansk', 'Deutsch', 'English',
    'Español', 'Français', 'Bahasa Indonesia',
    'Italiano', 'Nederlands', 'Norsk',
    'Polski', 'Português', 'Română',
    'Svenska', 'ภาษาไทย', 'Türkçe',
    'Українська'
  ];

  constructor() { }

  ngOnInit(): void {
    try {
      // Check if dark mode was previously selected
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        this.isDarkMode = true;
        document.body.classList.add('dark-theme');
      }
      
      // Load saved language preference if available
      const savedLanguage = localStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        this.selectedLanguage = savedLanguage;
      }
    } catch (error) {
      //console.error('Error accessing localStorage:', error);
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    
    try {
      if (this.isDarkMode) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Theme will still toggle visually even if storage fails
    }
  }
  
  toggleLanguageDialog(): void {
    this.showLanguageDialog = !this.showLanguageDialog;
  }
  
  selectLanguage(language: string): void {
    this.selectedLanguage = language;
    this.showLanguageDialog = false;
    
    try {
      localStorage.setItem('selectedLanguage', language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }
  
  closeLanguageDialog(event: MouseEvent): void {
    // Close dialog when clicking outside or on the close button
    this.showLanguageDialog = false;
  }
}
