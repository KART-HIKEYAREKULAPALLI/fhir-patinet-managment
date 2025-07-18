// public/script.js

const API_BASE_URL = 'http://localhost:3000/api'; // Your Node.js API base URL

// DOM Elements
const loadingIndicator = document.getElementById('loading-indicator');

// Top Controls
const togglePatientFormButton = document.getElementById('toggle-patient-form');
const formButtonText = document.getElementById('form-button-text');
const searchTypeSelect = document.getElementById('search-type');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Patient Form Section (now for both Create and Update)
const patientFormSection = document.getElementById('patient-form-section');
const patientDataForm = document.getElementById('patient-data-form');
const formTitle = document.getElementById('form-title');
const formMessageDiv = document.getElementById('form-message');

const patientIdField = document.getElementById('patient-id-field'); // Hidden ID field
const patientIdDisplay = document.getElementById('patient-id-display'); // Div to show ID
const displayPatientIdSpan = document.getElementById('display-patient-id'); // Span for readable ID

const formFirstNameInput = document.getElementById('form-first');
const formMiddleNameInput = document.getElementById('form-middle');
const formLastNameInput = document.getElementById('form-last');
const formGenderSelect = document.getElementById('form-gender');
const formPhoneInput = document.getElementById('form-phone');
const formDobInput = document.getElementById('form-dob');

const submitPatientFormButton = document.getElementById('submit-patient-form-button');
const submitButtonText = document.getElementById('submit-button-text');
const deletePatientButton = document.getElementById('delete-patient-button');
const cancelEditButton = document.getElementById('cancel-edit-button');


// Patient List Section
const patientTableBody = document.getElementById('patient-table-body');
const noPatientsMessage = document.getElementById('no-patients-message');
const prevPageButton = document.getElementById('prev-page-button');
const nextPageButton = document.getElementById('next-page-button');
const patientCountSpan = document.getElementById('patient-count');


let currentPatientResults = null; // Stores the last fetched patient results for pagination
let isEditMode = false; // Flag to track if the form is in edit mode or create mode

// --- Utility Functions ---

function showLoading() {
    loadingIndicator.style.display = 'block';
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
}

function displayMessage(element, message, type = 'info') {
    element.textContent = message;
    element.className = `mt-4 text-center font-medium ${
        type === 'success' ? 'text-green-600' :
        type === 'error' ? 'text-red-600' :
        'text-blue-600'
    }`;
}

function clearMessages() {
    formMessageDiv.textContent = '';
    // If you have other message divs, clear them here too
}

function setFormMode(mode, patientData = null) {
    clearMessages();
    if (mode === 'create') {
        isEditMode = false;
        formTitle.textContent = 'Create New Patient';
        submitButtonText.textContent = 'Submit Patient';
        submitPatientFormButton.classList.remove('bg-yellow-700', 'hover:bg-yellow-800');
        submitPatientFormButton.classList.add('bg-blue-700', 'hover:bg-blue-800');
        deletePatientButton.classList.add('hidden');
        cancelEditButton.classList.add('hidden');
        patientIdDisplay.style.display = 'none';
        patientIdField.value = ''; // Clear hidden ID
        patientDataForm.reset();
        togglePatientFormButton.classList.remove('bg-yellow-700', 'hover:bg-yellow-800');
        togglePatientFormButton.classList.add('bg-blue-700', 'hover:bg-blue-800');
        formButtonText.textContent = 'Hide Create Form';
        if (patientFormSection.classList.contains('hidden-section')) {
            patientFormSection.classList.remove('hidden-section');
        }
    } else if (mode === 'edit' && patientData) {
        isEditMode = true;
        formTitle.textContent = `Update Patient: ${patientData.name}`;
        submitButtonText.textContent = 'Update Patient';
        submitPatientFormButton.classList.remove('bg-blue-700', 'hover:bg-blue-800');
        submitPatientFormButton.classList.add('bg-yellow-700', 'hover:bg-yellow-800');
        deletePatientButton.classList.remove('hidden');
        cancelEditButton.classList.remove('hidden');
        patientIdDisplay.style.display = 'block'; // Show ID display
        displayPatientIdSpan.textContent = patientData.id;
        patientIdField.value = patientData.id; // Set hidden ID for submission

        // Populate form fields with patientData
        formFirstNameInput.value = patientData.first || '';
        formMiddleNameInput.value = patientData.middle || '';
        formLastNameInput.value = patientData.last || '';
        formGenderSelect.value = patientData.gender || '';
        formPhoneInput.value = patientData.phone || '';
        formDobInput.value = patientData.dob ? patientData.dob.split('T')[0] : ''; // Format for date input

        togglePatientFormButton.classList.remove('bg-blue-700', 'hover:bg-blue-800');
        togglePatientFormButton.classList.add('bg-yellow-700', 'hover:bg-yellow-800');
        formButtonText.textContent = 'Hide Update Form';
        if (patientFormSection.classList.contains('hidden-section')) {
            patientFormSection.classList.remove('hidden-section');
        }
    }
}

// --- API Interaction Functions ---

async function fetchPatients(params = {}) {
    showLoading();
    clearMessages();
    try {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/patients?${query}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch patients');
        }
        const data = await response.json();
        currentPatientResults = data; // Store results for pagination
        renderPatientTable(data.patients);
        updatePaginationControls(data);
        return data;
    } catch (error) {
        console.error('Error fetching patients:', error);
        displayMessage(noPatientsMessage, `Error: ${error.message}`, 'error'); // Display error in no-patients area
        renderPatientTable([]); // Clear table on error
        updatePaginationControls({ patients: [], total: 0, hasNextPage: false, hasPrevPage: false });
    } finally {
        hideLoading();
    }
}

async function fetchPatientById(id) {
    showLoading();
    clearMessages();
    try {
        const response = await fetch(`${API_BASE_URL}/patients/${id}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch patient with ID: ${id}`);
        }
        const patient = await response.json();
        return patient;
    } catch (error) {
        console.error('Error fetching single patient:', error);
        displayMessage(formMessageDiv, `Error fetching patient details: ${error.message}`, 'error');
        return null;
    } finally {
        hideLoading();
    }
}

async function createNewPatient(patientData) {
    showLoading();
    clearMessages();
    try {
        const response = await fetch(`${API_BASE_URL}/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create patient');
        }
        const newPatient = await response.json();
        displayMessage(formMessageDiv, `Patient created with ID: ${newPatient.id}`, 'success');
        patientDataForm.reset(); // Clear form
        setFormMode('create'); // Reset form to create mode explicitly
        fetchPatients({}); // Refresh patient list after creation
    } catch (error) {
        console.error('Error creating patient:', error);
        displayMessage(formMessageDiv, `Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function updateExistingPatient(id, updates) {
    showLoading();
    clearMessages();
    try {
        const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update patient');
        }
        const updatedPatient = await response.json();
        displayMessage(formMessageDiv, `Patient ${updatedPatient.id} updated successfully!`, 'success');
        // Keep form filled so user can make more edits or see confirmation
        fetchPatients({}); // Refresh patient list after update
    } catch (error) {
        console.error('Error updating patient:', error);
        displayMessage(formMessageDiv, `Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteExistingPatient(id) {
    showLoading();
    clearMessages();
    if (!confirm(`Are you sure you want to delete patient with ID: ${id}?`)) {
        hideLoading();
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete patient');
        }
        const deleteResult = await response.json();
        displayMessage(formMessageDiv, deleteResult.message, 'success');
        setFormMode('create'); // Reset form to create mode after deletion
        fetchPatients({}); // Refresh patient list after deletion
    } catch (error) {
        console.error('Error deleting patient:', error);
        displayMessage(formMessageDiv, `Error: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// --- UI Rendering Functions ---

function renderPatientTable(patients) {
    patientTableBody.innerHTML = ''; // Clear previous rows
    if (patients.length === 0) {
        noPatientsMessage.style.display = 'block';
    } else {
        noPatientsMessage.style.display = 'none';
        patients.forEach(patient => {
            const row = patientTableBody.insertRow();
            row.className = 'hover:bg-gray-50'; // Add hover effect

            // Apply 'border border-gray-200' to each td for full grid lines
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">${patient.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${patient.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">${patient.gender}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">${patient.phone}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">${patient.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium border border-gray-200">
                    <button class="edit-patient-button bg-yellow-600 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-700 mr-2" data-patient-id="${patient.id}">Edit</button>
                </td>
            `;
        });

        // Add event listeners for "Edit" buttons
        patientTableBody.querySelectorAll('.edit-patient-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const patientId = event.target.dataset.patientId;
                const patientData = await fetchPatientById(patientId);

                if (patientData) {
                    setFormMode('edit', patientData); // Set form to edit mode and populate
                }
            });
        });
    }
}

function updatePaginationControls(data) {
    prevPageButton.disabled = !data.hasPrevPage;
    nextPageButton.disabled = !data.hasNextPage;
    patientCountSpan.textContent = `Showing ${data.patients.length} of ${data.total} patients`;
}

// --- Event Listeners ---

// Toggle Create/Update Patient Form Visibility
togglePatientFormButton.addEventListener('click', () => {
    patientFormSection.classList.toggle('hidden-section');
    if (patientFormSection.classList.contains('hidden-section')) {
        // If hiding, reset to create mode
        setFormMode('create');
        formButtonText.textContent = 'Create New Patient';
        togglePatientFormButton.classList.remove('bg-yellow-700', 'hover:bg-yellow-800');
        togglePatientFormButton.classList.add('bg-blue-700', 'hover:bg-blue-800');
    } else {
        // If showing, and currently in create mode (not from an edit click), set text
        if (!isEditMode) {
             formButtonText.textContent = 'Hide Create Form';
        } else {
            // If it was already in edit mode and user clicked to show, keep edit text
            formButtonText.textContent = 'Hide Update Form';
        }
    }
});


// Patient Data Form Submission (handles both create and update)
patientDataForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(patientDataForm);
    const patientData = {};
    formData.forEach((value, key) => {
        // Only include non-empty string values for updates, but allow '0' for numbers if applicable
        if (typeof value === 'string' && value.trim() !== '') {
            patientData[key] = value.trim();
        } else if (typeof value !== 'string') {
            patientData[key] = value;
        }
    });

    if (isEditMode) {
        const patientId = patientIdField.value;
        if (!patientId) {
            displayMessage(formMessageDiv, 'Error: Patient ID is missing for update.', 'error');
            return;
        }
        await updateExistingPatient(patientId, patientData);
    } else {
        // Basic validation for create mode (required fields)
        if (!patientData.first || !patientData.last || !patientData.gender) {
            displayMessage(formMessageDiv, 'First Name, Last Name, and Gender are required!', 'error');
            return;
        }
        await createNewPatient(patientData);
    }
});

// Delete Patient Button (visible only in edit mode)
deletePatientButton.addEventListener('click', async () => {
    const patientId = patientIdField.value;
    if (patientId) {
        await deleteExistingPatient(patientId);
    } else {
        displayMessage(formMessageDiv, 'No patient ID found to delete.', 'error');
    }
});

// Cancel Edit Button
cancelEditButton.addEventListener('click', () => {
    setFormMode('create'); // Reset form to create mode and clear fields
    // If the form was visible because of an edit, hide it, otherwise let the user manually close.
    // If you always want to hide on cancel:
    // patientFormSection.classList.add('hidden-section');
    // formButtonText.textContent = 'Create New Patient';
});


// Search Button Click
searchButton.addEventListener('click', () => {
    const searchType = searchTypeSelect.value;
    const searchValue = searchInput.value.trim();

    const searchParams = {};
    if (searchValue) {
        if (searchType === 'name') {
            searchParams.name = searchValue;
        } else if (searchType === 'phone') {
            searchParams.phone = searchValue;
        } else if (searchType === 'birthdate') {
            searchParams.birthdate = searchValue;
        } else if (searchType === 'id') {
            searchParams.id = searchValue; // Corresponds to _id in FHIR service
        }
    }
    fetchPatients(searchParams);
});

// Allow search on 'Enter' key press in search input
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

// Pagination Buttons
prevPageButton.addEventListener('click', () => {
    if (currentPatientResults && currentPatientResults.prevLink) {
        fetchPatients({ pageUrl: currentPatientResults.prevLink });
    }
});

nextPageButton.addEventListener('click', () => {
    if (currentPatientResults && currentPatientResults.nextLink) {
        fetchPatients({ pageUrl: currentPatientResults.nextLink });
    }
});


// Initial load: Fetch default patients
document.addEventListener('DOMContentLoaded', () => {
    fetchPatients({}); // Fetch initial 10 latest patients
    setFormMode('create'); // Ensure form starts in create mode
});