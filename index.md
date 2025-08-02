---
layout: default
title: Home
---

# COMP30022 IT Project

Welcome to our comprehensive IT project documentation site!

## 🏗️ Project Overview

This project demonstrates a complete three-tier architecture deployment on AWS, featuring:

- **Frontend**: React-based user interface
- **Backend**: Node.js API server
- **Database**: MongoDB with persistent storage

## 📚 Documentation

<div class="docs-grid">
  <div class="doc-card">
    <h3><a href="{{ '/docs/architecture' | relative_url }}">🏛️ Architecture</a></h3>
    <p>Detailed system architecture and design decisions</p>
  </div>
  
  <div class="doc-card">
    <h3><a href="{{ '/docs/how-to-release-new-version' | relative_url }}">🚀 Release Guide</a></h3>
    <p>Step-by-step guide for releasing new versions</p>
  </div>
  
  <div class="doc-card">
    <h3><a href="{{ '/deployment' | relative_url }}">☁️ Deployment</a></h3>
    <p>AWS deployment instructions and configurations</p>
  </div>
</div>

## 🛠️ Technologies Used

- **Frontend**: React, CSS3, HTML5
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Infrastructure**: AWS EC2, EBS, Terraform
- **CI/CD**: GitHub Actions, SonarQube
- **Containerization**: Docker, Docker Compose

## 🚀 Quick Start

1. Clone the repository
2. Follow the [deployment guide]({{ '/deployment' | relative_url }})
3. Configure your AWS credentials
4. Run the deployment scripts

## 📊 Code Quality

This project maintains high code quality standards with:
- SonarQube analysis
- Automated testing
- Continuous integration

---

<style>
.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.doc-card {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 20px;
  background: #f6f8fa;
}

.doc-card h3 {
  margin-top: 0;
}

.doc-card a {
  text-decoration: none;
  color: #0366d6;
}

.doc-card a:hover {
  text-decoration: underline;
}
</style>
