// Global variables
let apiKey = '';
const rootPath = 'https://mysite.itvarsity.org/api/ContactBook/';

// Check if API key exists when page loads
function checkApiKey() {
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
        apiKey = storedApiKey;
        // Show contacts page (Show page)
        showContacts();
        // Get contacts (API call)
        getContacts()
    }
}

// Set the API Key and store it
function setApiKey() {
    const inputApiKey = document.getElementById('apiKeyInput').value.trim();

    if (!inputApiKey){
        alert('Please enter an API key!');
        return;
    }
    
    // Validate email format for API key
    if (!validateEmail(inputApiKey)) {
        alert('Please enter a valid email address as your API key.');
        return;
    }
    
    // Show loading state
    const setupBtn = document.querySelector('#setupPage .btn');
    const originalBtnText = setupBtn.textContent;
    setupBtn.textContent = '⏳ Validating...';
    setupBtn.disabled = true;
    
    // Add error message container if it doesn't exist
    let errorMsgContainer = document.getElementById('apiKeyErrorMsg');
    if (!errorMsgContainer) {
        errorMsgContainer = document.createElement('div');
        errorMsgContainer.id = 'apiKeyErrorMsg';
        errorMsgContainer.className = 'error';
        errorMsgContainer.style.display = 'none';
        document.querySelector('#setupPage .form-group').after(errorMsgContainer);
    }
    
    // Hide any previous error messages
    errorMsgContainer.style.display = 'none';

    // Validate API key first
    fetch(rootPath + "controller/api-key/?apiKey=" + inputApiKey)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.text();
        })
        .then(function (data) {
            if (data == "1") {
                apiKey = inputApiKey;
                localStorage.setItem("apiKey", apiKey);
                showContacts();
                getContacts();
            } else {
                errorMsgContainer.textContent = "Invalid API key entered! Please try again.";
                errorMsgContainer.style.display = 'block';
            }
        })
        .catch(function (error) {
            console.error('API key validation error:', error);
            
            // If there's a network error, we'll still set the API key
            // This is a fallback for when the validation endpoint is not working
            if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
                console.log('Network error detected, proceeding with API key');
                apiKey = inputApiKey;
                localStorage.setItem("apiKey", apiKey);
                showContacts();
                getContacts();
            } else {
                errorMsgContainer.textContent = 'Error validating your API Key: ' + error.message;
                errorMsgContainer.style.display = 'block';
            }
        })
        .finally(function() {
            // Reset button state
            setupBtn.textContent = originalBtnText;
            setupBtn.disabled = false;
        });
}

// Show different pages
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Show selected page
    document.getElementById(pageId).classList.add('active');
}

function showContacts() {
    showPage('contactsPage');
}

function showAddContacts() {
    showPage('addContactPage');
    // Clear the form
    document.getElementById('addContactForm').reset();
}

function showEditContact(contactId) {
    showPage('editContactPage')
    // Load contact data for editing
    loadContactForEdit(contactId);
}

function getContacts() {
    const contactsList = document.getElementById('contactsList');
    contactsList.innerHTML = '<div class="loading"> Loading contacts...</div>';

    // Add API key to the request
    fetch(rootPath + "controller/get-contacts/?apiKey=" + apiKey)
        .then(function (response){
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(function (data){
            displayContacts(data);
        })
        .catch(function (error){
            console.error('Error fetching contacts:', error);
            contactsList.innerHTML = '<div class="error">Something went wrong, please try again later.<br>' + error.message + '</div>';
        });
}

function displayContacts(contacts) {
    const contactsList = document.getElementById('contactsList');

    if (!contacts || contacts.length === 0) {
        contactsList.innerHTML = '<div class="loading">No contacts found. Add your first contact!</div>';
        return;
    }

    let html = '<div class="contacts-grid">';

    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];

        let avatarSrc = contact.avatar ?
            `${rootPath}controller/uploads/${contact.avatar}` :
            `https://ui-avatars.com/api/?name=${contact.firstname}+${contact.lastname}&background=ff6b6b&color=fff&size=120`;

        html += `
                <div class="contact-card">
                    <img src="${avatarSrc}" alt="Avatar" class="contact-avatar">
                    <div class="contact-name">${contact.firstname} ${contact.lastname}</div>
                    <div class="contact-details">
                        <p><strong>📲 Mobile:</strong> ${contact.mobile}</p>
                        <p><strong>📧 Email:</strong> ${contact.email}</p>
                    </div>
                    <div class="contact-actions">
                        <button class="btn btn-secondary" onclick="showEditContact('${contact.id}')">✏️ Edit</button>
                        <button class="btn btn-danger" onclick="deleteContact('${contact.id}')">🗑️ Delete</button>
                    </div>
                </div>
        `;
    }

    html += '</div>';
    contactsList.innerHTML = html;
}

function refreshContacts() {
    getContacts();
}

function addContact(event) {
    event.preventDefault();
    
    // Basic form validation
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!firstName || !lastName || !mobile || !email) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Validate email format
    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Validate mobile number (basic validation)
    if (!validateMobile(mobile)) {
        alert('Please enter a valid mobile number.');
        return;
    }

    const form = new FormData(document.querySelector('#addContactForm'));
    form.append('apiKey', apiKey);
    
    // Disable submit button and show loading state
    const submitBtn = document.querySelector('#addContactForm button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Saving...';
    submitBtn.disabled = true;

    fetch(rootPath + 'controller/insert-contact/', {
        method: 'POST',
        // Remove headers that can cause issues with FormData/file uploads
        body: form
    })
        .then(function (response){
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.text();
        })
        .then(function (data){
            if (data == "1") {
                alert("Contact added successfully!");
                showContacts();
                getContacts();
            } else {
                alert('Error adding contact: ' + data);
            }
        })
        .catch(function (error){
            console.error('Error adding contact:', error);
            alert('Something went wrong. Please try again. Error: ' + error.message);
        })
        .finally(function() {
            // Reset button state
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
}

function loadContactForEdit(contactId) {
    // Show loading indicator
    document.getElementById('editAvatarImage').innerHTML = '<div class="loading">Loading contact details...</div>';
    
    // Add API key to the request
    fetch(rootPath + 'controller/get-contacts/?id=' + contactId + '&apiKey=' + apiKey)
        .then(function (response){
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(function (data){
            if (data && data.length > 0) {
                const contact = data[0];

                // Show avatar if available
                if (contact.avatar) {
                    const avatarImg = `<img src="${rootPath}controller/uploads/${contact.avatar}" 
                                            width=200 style="border-radius: 10px;" />`;
                    document.getElementById("editAvatarImage").innerHTML = avatarImg;
                } else {
                    document.getElementById("editAvatarImage").innerHTML = '';
                }

                document.getElementById('editContactId').value = contact.id;
                document.getElementById('editFirstName').value = contact.firstname;
                document.getElementById('editLastName').value = contact.lastname;
                document.getElementById('editMobile').value = contact.mobile;
                document.getElementById('editEmail').value = contact.email;
            } else {
                alert('No contact details found or contact may have been deleted.');
                showContacts();
            }
        })
        .catch(function (error){
            console.error('Error loading contact details:', error);
            alert('Error loading contact details: ' + error.message);
            showContacts();
        })
}

function updateContact(event){
    event.preventDefault();
    
    // Basic form validation
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const mobile = document.getElementById('editMobile').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    
    if (!firstName || !lastName || !mobile || !email) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Validate email format
    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Validate mobile number (basic validation)
    if (!validateMobile(mobile)) {
        alert('Please enter a valid mobile number.');
        return;
    }

    const form = new FormData(document.querySelector("#editContactForm"));
    const contactId = document.getElementById('editContactId').value;

    form.append('apiKey', apiKey);
    form.append('id', contactId);
    
    // Disable submit button and show loading state
    const submitBtn = document.querySelector('#editContactForm button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Updating...';
    submitBtn.disabled = true;

    fetch(rootPath + 'controller/edit-contact/', {
        method: 'POST',
        // Remove headers that can cause issues with FormData/file uploads
        body: form
    })
        .then(function (response){
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.text();
        })
        .then(function (data){
            if (data == "1") {
                alert("Contact updated successfully!");
                showContacts();
                getContacts();
            } else {
                alert('Error updating contact: ' + data);
            }
        })
        .catch(function (error){
            console.error('Error updating contact:', error);
            alert('Something went wrong. Please try again. Error: ' + error.message);
        })
        .finally(function() {
            // Reset button state
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
}

function deleteContact(contactId) {
    var confirmDelete = confirm("Delete contact. Are you sure?");

    if (confirmDelete == true) {
        // Show loading state in the contact card
        const contactCard = document.querySelector(`.contact-card button[onclick="deleteContact('${contactId}')"]`).closest('.contact-card');
        if (contactCard) {
            contactCard.style.opacity = '0.5';
            contactCard.style.pointerEvents = 'none';
        }
        
        // Add API key to the request
        fetch(rootPath + 'controller/delete-contact/?id=' + contactId + '&apiKey=' + apiKey)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.status);
                }
                return response.text();
            })
            .then(function (data){
                if (data == "1") {
                    alert('Contact deleted successfully!');
                    getContacts();
                } else {
                    alert('Error deleting contact: ' + data);
                    // Reset contact card if error
                    if (contactCard) {
                        contactCard.style.opacity = '1';
                        contactCard.style.pointerEvents = 'auto';
                    }
                }
            })
            .catch(function (error){
                console.error('Error deleting contact:', error);
                alert('Something went wrong. Please try again. Error: ' + error.message);
                // Reset contact card if error
                if (contactCard) {
                    contactCard.style.opacity = '1';
                    contactCard.style.pointerEvents = 'auto';
                }
            });
    }
}

// Search contacts functionality
function searchContacts() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const contactCards = document.querySelectorAll('.contact-card');
    
    contactCards.forEach(card => {
        const name = card.querySelector('.contact-name').textContent.toLowerCase();
        const mobile = card.querySelector('.contact-details p:nth-child(1)').textContent.toLowerCase();
        const email = card.querySelector('.contact-details p:nth-child(2)').textContent.toLowerCase();
        
        // Check if any of the contact details match the search query
        if (name.includes(searchInput) || mobile.includes(searchInput) || email.includes(searchInput)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show message if no results found
    const visibleCards = document.querySelectorAll('.contact-card[style="display: block"]');
    const noResultsMsg = document.getElementById('noResultsMsg');
    
    if (visibleCards.length === 0 && searchInput !== '') {
        if (!noResultsMsg) {
            const msg = document.createElement('div');
            msg.id = 'noResultsMsg';
            msg.className = 'loading';
            msg.textContent = 'No contacts found matching your search.';
            document.getElementById('contactsList').appendChild(msg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Helper function to validate email format
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Helper function to validate mobile number (basic validation)
function validateMobile(mobile) {
    // Remove spaces, dashes, and parentheses
    const cleanedNumber = mobile.replace(/[\s\-()]/g, '');
    // Check if it's a valid number (at least 10 digits)
    return cleanedNumber.length >= 10 && /^\+?[0-9]+$/.test(cleanedNumber);
}

// Function to log out (reset API key)
function logOut() {
    const confirmLogout = confirm("Are you sure you want to log out? This will clear your API key.");
    if (confirmLogout) {
        localStorage.removeItem('apiKey');
        apiKey = '';
        alert("You have been logged out successfully.");
        location.reload();
    }
}

window.onload = function() {
    checkApiKey();
    
    // Add logout button to contacts page
    const contactsHeader = document.querySelector('#contactsPage div:first-child div');
    if (contactsHeader) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-danger';
        logoutBtn.textContent = '🚪 Log Out';
        logoutBtn.onclick = logOut;
        contactsHeader.appendChild(logoutBtn);
    }
};

