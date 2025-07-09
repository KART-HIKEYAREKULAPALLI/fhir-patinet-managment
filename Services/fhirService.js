const axios = require('axios');
const base_url = process.env.FHIR_BASE_URL || 'https://fhir-bootcamp.medblocks.com/fhir/';

// Centralized Patient mapping for consistency and readability
function mapPatientResource(resource) { // Changed parameter from entry to resource
    if (!resource || resource.resourceType !== 'Patient') {
        return null;
    }
    return {
        id: resource.id,
        name: (resource.name?.[0]?.given?.join(' ') || '') + ' ' + (resource.name?.[0]?.family || '') || 'No Name',
        phone: resource.telecom?.find(t => t.system === 'phone')?.value || 'No Phone',
        email: resource.telecom?.find(t => t.system === 'email')?.value || 'No Email',
        birthDate: resource.birthDate || 'No Birth Date',
        gender: resource.gender || 'No Gender Mentioned'
    };
}

/**
 * Searches for Patient resources with pagination.
 * This function handles both initial searches and subsequent pagination requests
 * by using either `searchParams` or a full `pageUrl` from a previous bundle.
 * @param {object} options - Options for the search.
 * @param {object} [options.searchParams={}] - FHIR search parameters (e.g., { name: 'John', gender: 'male' }).
 * @param {string} [options.pageUrl=null] - A full URL for the next/previous page link from a FHIR Bundle.
 * @returns {Promise<object>} - An object containing patients, total, and pagination links.
 */
async function getPaginatedPatients({ searchParams = {}, pageUrl = null } = {}) {
    try {
        let requestUrl;
        let paramsToUse = new URLSearchParams();

        if (pageUrl) {
            requestUrl = pageUrl;
        } else {
            requestUrl = `${base_url}/Patient`;
            paramsToUse.set('_count', '10'); // Explicitly setting count for consistent pagination
            paramsToUse.set('_sort', '-_lastUpdated');

            for (const key in searchParams) {
                if (searchParams[key] !== undefined && searchParams[key] !== null) {
                    paramsToUse.set(key, String(searchParams[key]));
                }
            }
        }

        console.log('Requesting URL:', requestUrl + (paramsToUse.toString() ? '?' + paramsToUse.toString() : ''));

        const response = await axios.get(requestUrl, {
            params: pageUrl ? {} : paramsToUse
        });

        const bundle = response.data;

        const patients = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Patient')
            .map(entry => mapPatientResource(entry.resource)) // Pass resource, not entry
            .filter(Boolean) || [];

        const selfLink = bundle.link?.find(link => link.relation === 'self')?.url || null;
        const nextLink = bundle.link?.find(link => link.relation === 'next')?.url || null;
        const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url || null;
        const firstLink = bundle.link?.find(link => link.relation === 'first')?.url || null;
        const lastLink = bundle.link?.find(link => link.relation === 'last')?.url || null;

        let currentSearchParams = {};
        if (selfLink) {
            const selfUrlObj = new URL(selfLink);
            selfUrlObj.searchParams.forEach((value, key) => {
                if (!['_count', '_offset', '_getpagesoffset', '_page', 'page'].includes(key.toLowerCase())) {
                    currentSearchParams[key] = value;
                }
            });
        }
        if (searchParams._sort) {
            currentSearchParams._sort = searchParams._sort;
        }

        return {
            patients,
            total: bundle.total || 0,
            currentSearchParams,
            selfLink,
            nextLink,
            prevLink,
            firstLink,
            lastLink,
            hasNextPage: !!nextLink,
            hasPrevPage: !!prevLink
        };

    } catch (error) {
        console.error('Error fetching patients:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
        throw new Error(`Failed to fetch patients: ${error.message}`);
    }
}

/**
 * Creates a patient with first name, middle name (optional), and family name.
 * @param {string} [use='official'] - FHIR name use.
 * @param {string} first - First name (required).
 * @param {string} [middle] - Middle name (optional).
 * @param {string} last - Family name (required).
 * @param {string} gender - Gender (required: male, female, other, unknown).
 * @param {string} [phone] - Phone number (optional).
 * @param {string} [dob] - Date of birth in YYYY-MM-DD format (optional).
 * @returns {Promise<object>} - The created patient resource.
 */
async function createPatient(use = 'official', first, middle, last, gender, phone, dob) {
    try {
        if (!first || !last || !gender) {
            throw new Error('first, last, and gender are required');
        }
        const validUses = ['usual', 'official', 'temp', 'nickname', 'anonymous', 'old', 'maiden'];
        if (!validUses.includes(use)) {
            throw new Error(`Invalid name use: ${use}. Must be one of ${validUses.join(', ')}`);
        }
        if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
            throw new Error('birthDate must be in YYYY-MM-DD format');
        }
        const given = [first];
        if (middle) {
            given.push(middle);
        }
        const text = [first, middle, last].filter(Boolean).join(' ');
        const patient = {
            resourceType: 'Patient',
            name: [{ use, given, family: last, text }],
            gender,
            telecom: phone ? [{ system: 'phone', value: phone }] : [],
            birthDate: dob || undefined
        };
        const result = await axios.post(`${base_url}/Patient`, patient);
        console.log('Created patient:', result.data.id);
        return result.data;
    } catch (error) {
        console.error('Error creating patient:', error.message);
        throw error;
    }
}

/**
 * Updates an existing patient with provided fields, preserving others.
 * @param {string} id - The patient ID.
 * @param {object} updates - An object containing fields to update (e.g., { first: 'New', last: 'Name' }).
 * @returns {Promise<object>} - The updated patient resource.
 */
async function updatePatient(id, updates = {}) {
    try {
        if (!id) {
            throw new Error('Patient ID is required');
        }

        const response = await axios.get(`${base_url}/Patient/${id}`);
        const existing = response.data;

        if (existing.resourceType !== 'Patient') {
            throw new Error('Resource is not a Patient');
        }

        const updatedPatient = { ...existing };

        // Handle name updates
        if (updates.first || updates.middle || updates.last || updates.use) {
            const currentName = existing.name?.[0] || {};
            const newName = {
                use: updates.use || currentName.use || 'official',
                given: [],
                family: updates.last || currentName.family || '' // Ensure family is a string
            };

            // Reconstruct given array based on updates and existing data
            if (updates.first) {
                newName.given.push(updates.first);
            } else if (currentName.given && currentName.given[0]) {
                newName.given.push(currentName.given[0]);
            }

            if (updates.middle) {
                newName.given.push(updates.middle);
            } else if (currentName.given && currentName.given.length > 1) {
                newName.given = [...newName.given, ...currentName.given.slice(1)];
            }

            newName.text = [newName.given?.[0], updates.middle, newName.family].filter(Boolean).join(' ');
            updatedPatient.name = [newName];
        }

        // Handle gender update
        if (updates.gender) {
            updatedPatient.gender = updates.gender;
        }

        // Handle phone update (replaces existing phone telecom entry or adds new)
        if (updates.phone !== undefined) {
            const existingTelecom = existing.telecom?.filter(t => t.system !== 'phone') || [];
            if (updates.phone) {
                existingTelecom.push({ system: 'phone', value: updates.phone });
            }
            updatedPatient.telecom = existingTelecom;
        }

        // Handle birthDate update
        if (updates.dob !== undefined) {
            if (updates.dob && !/^\d{4}-\d{2}-\d{2}$/.test(updates.dob)) {
                throw new Error('birthDate must be in YYYY-MM-DD format');
            }
            updatedPatient.birthDate = updates.dob || undefined;
        }

        const result = await axios.put(`${base_url}/Patient/${id}`, updatedPatient);
        console.log('Updated patient:', result.data.id);
        return result.data;
    } catch (error) {
        console.error('Error updating patient:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
        throw error;
    }
}

/**
 * Fetches a single patient by ID from the FHIR server.
 * @param {string} id - The ID of the patient to fetch.
 * @returns {Promise<object>} - The patient resource with extracted fields.
 */
async function getPatientById(id) {
    try {
        const response = await axios.get(`${base_url}/Patient/${id}`);
        const patient = response.data;

        // Extract relevant data for the frontend (similar to how you render the table)
        const name = patient.name && patient.name[0] ?
            (patient.name[0].given ? patient.name[0].given.join(' ') + ' ' : '') + (patient.name[0].family || '') : 'N/A';
        const first = patient.name && patient.name[0] && patient.name[0].given ? patient.name[0].given[0] : '';
        const middle = patient.name && patient.name[0] && patient.name[0].given && patient.name[0].given.length > 1 ? patient.name[0].given.slice(1).join(' ') : '';
        const last = patient.name && patient.name[0] ? patient.name[0].family : '';
        const gender = patient.gender || 'N/A';
        const phone = patient.telecom ? patient.telecom.find(t => t.system === 'phone')?.value : ''; // Return empty string for blank phone
        const email = patient.telecom ? patient.telecom.find(t => t.system === 'email')?.value : ''; // Return empty string for blank email
        const dob = patient.birthDate || ''; // Return empty string for blank DOB

        return {
            id: patient.id,
            name: name.trim(),
            first: first,
            middle: middle,
            last: last,
            gender: gender,
            phone: phone,
            email: email,
            dob: dob // Pass as is, frontend will format if needed
        };

    } catch (error) {
        console.error(`Error fetching patient by ID ${id} from FHIR server:`, error.response ? error.response.data : error.message);
        throw new Error('Failed to retrieve patient from FHIR server.');
    }
}

/**
 * Deletes a patient by ID.
 * @param {string} id - The patient ID.
 * @returns {Promise<void>}
 */
async function deletePatient(id) {
    try {
        if (!id) {
            throw new Error('Patient ID is required for deletion');
        }
        await axios.delete(`${base_url}/Patient/${id}`);
        console.log(`Patient with ID ${id} deleted successfully.`);
        return { message: `Patient with ID ${id} deleted successfully.` };
    } catch (error) {
        console.error(`Error deleting patient ${id}:`, error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
        throw new Error(`Failed to delete patient ${id}: ${error.message}`);
    }
}


// Export all functions for use in server.js
module.exports = {
    getPaginatedPatients,
    createPatient,
    updatePatient,
    deletePatient,
    getPatientById, // <-- This is the crucial line added/confirmed
    searchPatientsByName: (name) => getPaginatedPatients({ searchParams: { 'name:contains': name } }),
    searchPatientsDateBirth: (birthdate) => getPaginatedPatients({ searchParams: { birthdate: birthdate } }),
    searchPatientsByPhone: (phone) => getPaginatedPatients({ searchParams: { telecom: phone } }),
    getDefaultPatients: () => getPaginatedPatients({ searchParams: { _sort: '-_lastUpdated' } }),
    paginateNext: (currentResult) => getPaginatedPatients({ pageUrl: currentResult.nextLink }),
    paginatePrevious: (currentResult) => getPaginatedPatients({ pageUrl: currentResult.prevLink }),
};
