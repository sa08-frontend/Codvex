// Complete JavaScript for submit idea form functionality

document.addEventListener('DOMContentLoaded', () => {
    // Initialize variables
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    const themeToggle = document.querySelector('.theme-toggle');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const closeMobileNav = document.querySelector('.close-mobile-nav');
    const form = document.getElementById('websiteIdeaForm');
    const steps = document.querySelectorAll('.step');
    const sections = document.querySelectorAll('.form-section');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const progressBar = document.querySelector('.progress-bar');
    const submitButton = document.querySelector('.submit-btn');
    const termsCheckbox = document.getElementById('terms');
    const fileInput = document.getElementById('files');
    const fileList = document.querySelector('.file-list');
    const categorySelect = document.getElementById('category');
    const enhancedCategories = document.querySelector('.enhanced-categories');
    
    let currentStep = 1;
    let posX = 0, posY = 0, mouseX = 0, mouseY = 0;

    // Custom cursor functionality
    if (cursor && follower) {
        gsap.to({}, 0.016, {
            repeat: -1,
            onRepeat: () => {
                posX += (mouseX - posX) / 9;
                posY += (mouseY - posY) / 9;
                gsap.set(follower, { css: { left: posX, top: posY } });
                gsap.set(cursor, { css: { left: mouseX, top: mouseY } });
            }
        });

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
    }

    // Theme toggle functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            themeToggle.textContent = document.body.classList.contains('light-theme') ? '🌙' : '🌓';
            localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        });

        // Load saved theme
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.textContent = '🌙';
        }
    }

    // Mobile navigation
    if (mobileMenuToggle && mobileNav && closeMobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileNav.classList.add('open');
        });

        closeMobileNav.addEventListener('click', () => {
            mobileNav.classList.remove('open');
        });

        // Close mobile nav when clicking on links
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
            });
        });
    }

    // Progress and step management
    const updateProgress = (step) => {
        steps.forEach(s => s.classList.remove('active', 'completed'));
        for (let i = 1; i <= step; i++) {
            const s = document.querySelector(`.step[data-step="${i}"]`);
            if (s) {
                s.classList.add(i === step ? 'active' : 'completed');
            }
        }
        if (progressBar) {
            progressBar.style.width = `${(step / steps.length) * 100}%`;
        }
    };

    const switchSection = (from, to) => {
        const currentSection = document.querySelector(`.form-section[data-step="${from}"]`);
        const nextSection = document.querySelector(`.form-section[data-step="${to}"]`);
        
        if (currentSection && nextSection) {
            currentSection.classList.add('fadeOut');
            setTimeout(() => {
                currentSection.classList.remove('active', 'fadeOut');
                nextSection.classList.add('active');
                currentStep = parseInt(to);
                updateProgress(currentStep);
            }, 300);
        }
    };

    // Form validation
    const validateStep = (step) => {
        const section = document.querySelector(`.form-section[data-step="${step}"]`);
        if (!section) return false;
        
        const inputs = section.querySelectorAll('input[required], textarea[required], select[required]');
        let valid = true;
        let firstInvalidField = null;

        inputs.forEach(input => {
            const value = input.value.trim();
            let isFieldValid = true;

            // Basic required field validation
            if (!value) {
                isFieldValid = false;
            }

            // Email validation
            if (input.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isFieldValid = false;
                }
            }

            // Phone validation (if provided)
            if (input.type === 'number' && input.name === 'phone' && value) {
                if (value.length < 10) {
                    isFieldValid = false;
                }
            }

            if (!isFieldValid) {
                valid = false;
                input.classList.add('error');
                if (!firstInvalidField) {
                    firstInvalidField = input;
                }
                
                // Remove error class after 3 seconds
                setTimeout(() => input.classList.remove('error'), 3000);
            } else {
                input.classList.remove('error');
            }
        });

        if (!valid) {
            showNotification('Please fill out all required fields correctly.', 'error');
            if (firstInvalidField) {
                firstInvalidField.focus();
            }
        }

        return valid;
    };

    // Navigation button event listeners
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const nextStep = button.getAttribute('data-next');
            if (validateStep(currentStep)) {
                if (currentStep === 4) {
                    updateSummary();
                }
                switchSection(currentStep, nextStep);
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            const prevStep = button.getAttribute('data-prev');
            switchSection(currentStep, prevStep);
        });
    });

    // Word counter for textareas
    const setupWordCounters = () => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            const counter = textarea.nextElementSibling?.querySelector('span');
            if (counter) {
                const updateCounter = () => {
                    const words = textarea.value.trim().split(/\s+/).filter(word => word.length > 0).length;
                    counter.textContent = `${words} words`;
                };
                
                textarea.addEventListener('input', updateCounter);
                updateCounter(); // Initial count
            }
        });
    };

    // Enhanced category selection
    const setupCategoryCards = () => {
        if (!categorySelect || !enhancedCategories) return;

        const categories = Array.from(categorySelect.options).slice(1).map(opt => ({
            value: opt.value,
            text: opt.text,
            icon: getCategoryIcon(opt.value)
        }));

        categories.forEach(category => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <div class="category-icon">${category.icon}</div>
                <div>${category.text}</div>
            `;
            card.addEventListener('click', () => {
                document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                categorySelect.value = category.value;
            });
            enhancedCategories.appendChild(card);
        });
    };

    const getCategoryIcon = (value) => {
        const icons = {
            blog: '📝',
            ecommerce: '🛒',
            portfolio: '🎨',
            business: '💼',
            news: '📰',
            entertainment: '🎥',
            education: '📚',
            social: '🌐',
            other: '❓'
        };
        return icons[value] || '❓';
    };

    // File upload management
    const setupFileUpload = () => {
        if (!fileInput || !fileList) return;

        const maxFileSize = 10 * 1024 * 1024; // 10MB
        let selectedFiles = [];

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            
            files.forEach(file => {
                if (file.size > maxFileSize) {
                    showNotification(`File ${file.name} exceeds 10MB limit.`, 'error');
                    return;
                }

                // Check if file already exists
                if (selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
                    showNotification(`File ${file.name} is already selected.`, 'error');
                    return;
                }

                selectedFiles.push(file);
                addFileToList(file);
            });

            updateFileInput();
        });

        const addFileToList = (file) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-icon">${getFileIcon(file.type)}</div>
                <div class="file-info">
                    <div class="file-item-name" title="${file.name}">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
                <button type="button" class="file-item-remove" title="Remove file">×</button>
            `;
            
            fileItem.querySelector('.file-item-remove').addEventListener('click', () => {
                selectedFiles = selectedFiles.filter(f => !(f.name === file.name && f.size === file.size));
                fileItem.remove();
                updateFileInput();
            });
            
            fileList.appendChild(fileItem);
        };

        const updateFileInput = () => {
            const dt = new DataTransfer();
            selectedFiles.forEach(file => dt.items.add(file));
            fileInput.files = dt.files;
        };
    };

    const getFileIcon = (type) => {
        if (type.includes('pdf')) return '📄';
        if (type.includes('image')) return '🖼️';
        if (type.includes('word')) return '📝';
        if (type.includes('html')) return '🌐';
        if (type.includes('css')) return '🎨';
        if (type.includes('javascript')) return '📜';
        return '📎';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Summary update
    const updateSummary = () => {
        const summaryFields = [
            { id: 'summary-name', inputId: 'name' },
            { id: 'summary-email', inputId: 'email' },
            { id: 'summary-phone', inputId: 'phone' },
            { id: 'summary-websiteName', inputId: 'websiteName' },
            { id: 'summary-description', inputId: 'description' },
            { id: 'summary-targetAudience', inputId: 'targetAudience' },
            { id: 'summary-monetizationDetails', inputId: 'monetizationDetails' },
            { id: 'summary-referenceLinks', inputId: 'referenceLinks' }
        ];

        summaryFields.forEach(field => {
            const summaryEl = document.getElementById(field.id);
            const inputEl = document.getElementById(field.inputId);
            if (summaryEl && inputEl) {
                summaryEl.textContent = inputEl.value.trim() || 'Not provided';
            }
        });

        // Handle select fields
        const categorySummary = document.getElementById('summary-category');
        if (categorySummary && categorySelect) {
            categorySummary.textContent = categorySelect.options[categorySelect.selectedIndex]?.text || 'Not selected';
        }

        const monetizationSummary = document.getElementById('summary-monetization');
        const monetizationSelect = document.getElementById('monetization');
        if (monetizationSummary && monetizationSelect) {
            monetizationSummary.textContent = monetizationSelect.options[monetizationSelect.selectedIndex]?.text || 'Not selected';
        }

        // Handle files
        const filesSummary = document.getElementById('summary-files');
        if (filesSummary && fileList) {
            const fileNames = Array.from(fileList.children).map(item => 
                item.querySelector('.file-item-name').textContent
            );
            filesSummary.textContent = fileNames.length > 0 ? fileNames.join(', ') : 'No files uploaded';
        }
    };

    // Terms checkbox handler
    if (termsCheckbox && submitButton) {
        termsCheckbox.addEventListener('change', () => {
            submitButton.disabled = !termsCheckbox.checked;
        });
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateStep(currentStep)) return;
            
            if (!termsCheckbox.checked) {
                showNotification('You must agree to the Terms and Conditions.', 'error');
                return;
            }

            submitButton.disabled = true;
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="loading-spinner"></span>Submitting...';

            try {
                const formData = new FormData(form);
                const response = await fetch('/api/submityouridea', {
                    method: 'POST',
                    body: formData
                });

                // Check if response is ok and has content
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Check if response has content before parsing JSON
                const text = await response.text();
                if (!text) {
                    throw new Error('Empty response from server');
                }

                let result;
                try {
                    result = JSON.parse(text);
                } catch (jsonError) {
                    console.error('Invalid JSON response:', text);
                    throw new Error('Server returned invalid response. Please try again.');
                }

                if (result.success) {
                    // Show success message
                    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
                    
                    const successMessage = document.querySelector('.success-message');
                    if (successMessage) {
                        const websiteName = document.getElementById('websiteName').value;
                        successMessage.innerHTML = `
                            <i>✅</i>
                            <h2>Submission Successful!</h2>
                            <p>Thank you for submitting your website idea "<strong>${websiteName}</strong>"!</p>
                            <div style="background: var(--secondary); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid var(--accent);">
                                <p><strong>📧 Check your email!</strong> We've sent you a confirmation email with all the details of your submission.</p>
                                <p><strong>⏱️ Review Timeline:</strong> Our team will review your idea within 5-7 business days.</p>
                                <p><strong>📞 Next Steps:</strong> If approved, we'll contact you to discuss the partnership details.</p>
                            </div>
                            <p><strong>Submission ID:</strong> <code>${result.idea_id}</code></p>
                            <button type="button" class="btn btn-primary" onclick="window.location.href='Ree Force.html'">Back to Home</button>
                        `;
                        successMessage.classList.remove('hidden');
                    }
                    
                    // Reset form
                    form.reset();
                    if (fileList) fileList.innerHTML = '';
                    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
                    currentStep = 1;
                    updateProgress(1);
                    
                    showNotification('Form submitted successfully! Check your email for confirmation.', 'success');
                } else {
                    throw new Error(result.message || 'Submission failed');
                }
            } catch (error) {
                showNotification(error.message || 'Failed to submit form. Please try again.', 'error');
                console.error('Submission error:', error);
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        });
    }

    // Notification system
    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = 'background: none; border: none; color: inherit; font-size: 18px; float: right; cursor: pointer; margin-left: 10px;';
        closeBtn.onclick = () => notification.remove();
        notification.appendChild(closeBtn);
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    };

    // Domain availability check (placeholder)
    const websiteNameInput = document.getElementById('websiteName');
    const domainStatus = document.querySelector('.domain-status');
    
    if (websiteNameInput && domainStatus) {
        let timeoutId;
        websiteNameInput.addEventListener('input', () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const name = websiteNameInput.value.trim();
                if (name.length > 2) {
                    domainStatus.innerHTML = '<span style="color: var(--accent);">💡 We\'ll help you find the perfect domain!</span>';
                } else {
                    domainStatus.innerHTML = '';
                }
            }, 500);
        });
    }

    // Initialize all components
    updateProgress(1);
    setupWordCounters();
    setupCategoryCards();
    setupFileUpload();
    
    // Add input event listeners for real-time summary updates
    form.addEventListener('input', () => {
        if (currentStep === 5) {
            updateSummary();
        }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
// Add this JavaScript to your existing script.js file or include it in your HTML

// Contact form functionality
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('#contact form');
    
    if (contactForm) {
        // Add loading state styles
        const style = document.createElement('style');
        style.textContent = `
            .btn-loading {
                opacity: 0.7;
                cursor: not-allowed;
                position: relative;
            }
            .btn-loading::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                margin: auto;
                border: 2px solid transparent;
                border-top-color: #ffffff;
                border-radius: 50%;
                animation: button-loading-spinner 1s ease infinite;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
            }
            @keyframes button-loading-spinner {
                from { transform: translate(-50%, -50%) rotate(0turn); }
                to { transform: translate(-50%, -50%) rotate(1turn); }
            }
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification.success {
                background-color: #00c853;
            }
            .notification.error {
                background-color: #f44336;
            }
            .notification .close-btn {
                background: none;
                border: none;
                color: white;
                float: right;
                font-size: 18px;
                cursor: pointer;
                margin-left: 10px;
            }
        `;
        document.head.appendChild(style);

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const nameField = this.querySelector('#name');
            const emailField = this.querySelector('#email');
            const messageField = this.querySelector('#message');
            
            // Validate fields
            if (!nameField.value.trim()) {
                showNotification('Please enter your name', 'error');
                nameField.focus();
                return;
            }
            
            if (!emailField.value.trim()) {
                showNotification('Please enter your email', 'error');
                emailField.focus();
                return;
            }
            
            if (!isValidEmail(emailField.value.trim())) {
                showNotification('Please enter a valid email address', 'error');
                emailField.focus();
                return;
            }
            
            if (!messageField.value.trim()) {
                showNotification('Please enter your message', 'error');
                messageField.focus();
                return;
            }
            
            // Show loading state
            submitButton.classList.add('btn-loading');
            submitButton.disabled = true;
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            
            try {
                const formData = {
                    contact_name: nameField.value.trim(),
                    contact_email: emailField.value.trim(),
                    contact_message: messageField.value.trim()
                };
                
                const response = await fetch('http://localhost:5000/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('Message sent successfully! We\'ll get back to you within 24-48 hours.', 'success');
                    this.reset(); // Clear the form
                } else {
                    showNotification(result.message || 'Failed to send message. Please try again.', 'error');
                }
                
            } catch (error) {
                console.error('Contact form error:', error);
                showNotification('Network error. Please check your connection and try again.', 'error');
            } finally {
                // Reset button state
                submitButton.classList.remove('btn-loading');
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });
        
        // Add real-time validation feedback
        const emailInput = contactForm.querySelector('#email');
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                if (this.value.trim() && !isValidEmail(this.value.trim())) {
                    this.style.borderColor = '#f44336';
                } else {
                    this.style.borderColor = '';
                }
            });
            
            emailInput.addEventListener('input', function() {
                this.style.borderColor = '';
            });
        }
    }
    
    // Helper functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        };
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        notification.appendChild(messageSpan);
        notification.appendChild(closeBtn);
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
});

// Also update the existing website idea form to work with the new backend
// Make sure the form submission URL matches your backend
document.addEventListener('DOMContentLoaded', function() {
    const ideaForm = document.getElementById('websiteIdeaForm');
    if (ideaForm) {
        // Update the action URL to match your backend
        ideaForm.action = 'http://localhost:5000/api/submityouridea';
    }
});