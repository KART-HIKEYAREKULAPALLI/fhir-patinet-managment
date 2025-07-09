const express = require('express');
const cors = require('cors'); // For handling Cross-Origin Resource Sharing
require('dotenv').config(); // Load environment variables from .env file

const fhirService = require('./services/fhirService'); // Import your FHIR service functions

const app = express();
const PORT = process.env.PORT || 3000; // Use port from environment or default to 3000

// Middleware
app.use(cors()); // Enable CORS for all routes (important for local development if frontend is served differently)
app.use(express.json()); // Enable parsing of JSON request bodies
app.use(express.static('public')); // Serve static files from the 'public' directory

// API Routes

// GET /api/patients - Search patients with pagination (INCLUDING ID SEARCH)
app.get('/api/patients', async (req, res) => {
    try {
        // Extract search parameters from query string
        const { name, phone, birthdate, id, pageUrl } = req.query; // Added 'id' here
        let searchParams = {};

        if (name) searchParams['name:contains'] = name;
        if (phone) searchParams.telecom = phone; // Use telecom for phone search
        if (birthdate) searchParams.birthdate = birthdate;
        if (id) searchParams._id = id; // Add ID search parameter here. FHIR uses _id for ID search.

        const result = await fhirService.getPaginatedPatients({ searchParams, pageUrl });
        res.json(result);
    } catch (error) {
        console.error('API Error /api/patients GET:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/patients - Create a new patient
app.post('/api/patients', async (req, res) => {
    try {
        const { use, first, middle, last, gender, phone, dob } = req.body;
        const newPatient = await fhirService.createPatient(use, first, middle, last, gender, phone, dob);
        res.status(201).json(newPatient); // 201 Created
    } catch (error) {
        console.error('API Error /api/patients POST:', error.message);
        res.status(400).json({ error: error.message }); // 400 Bad Request for validation errors
    }
});

// Route to get a single patient by ID (for the 'Edit' modal population)
app.get('/api/patients/:id', async (req, res) => {
    const patientId = req.params.id;
    try {
        const patient = await fhirService.getPatientById(patientId);
        if (patient) {
            res.json(patient);
        } else {
            res.status(404).json({ error: 'Patient not found' });
        }
    } catch (error) {
        console.error(`Error fetching patient ${patientId}:`, error);
        res.status(500).json({ error: 'Failed to fetch patient', details: error.message });
    }
});

// PUT /api/patients/:id - Update an existing patient
app.put('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedPatient = await fhirService.updatePatient(id, updates);
        res.json(updatedPatient);
    } catch (error) {
        console.error('API Error /api/patients PUT:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/patients/:id - Delete a patient
app.delete('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteResult = await fhirService.deletePatient(id);
        res.json(deleteResult);
    } catch (error) {
        console.error('API Error /api/patients DELETE:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to access the application.`);
});