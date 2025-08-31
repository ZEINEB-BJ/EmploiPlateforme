import React, { useState } from "react";
import { Modal, Button, Tab, Tabs } from "react-bootstrap";
import SortedApplications from "./SortedApplications";

const JobApplicationsManager = ({
  show,
  onHide,
  jobId,
  jobTitle,
  onStatusUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("sorted");

  const handleStatusUpdate = (applicationId, status) => {
    if (onStatusUpdate) {
      onStatusUpdate(applicationId, status);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="bi bi-people me-2"></i>
          Candidatures - {jobTitle}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <Tabs
          activeKey={activeTab}
          onSelect={setActiveTab}
          className="border-bottom"
        >
          <Tab
            eventKey="sorted"
            title={
              <span>
                <i className="bi bi-sort-down me-1"></i>
                Triées par score
              </span>
            }
          >
            <div className="p-3">
              <SortedApplications
                jobId={jobId}
                onStatusUpdate={handleStatusUpdate}
                showHeader={false}
              />
            </div>
          </Tab>

          <Tab
            eventKey="chronological"
            title={
              <span>
                <i className="bi bi-calendar me-1"></i>
                Vue chronologique
              </span>
            }
          >
            <div className="p-3">
              <div className="text-center py-4">
                <i
                  className="bi bi-clock text-muted"
                  style={{ fontSize: "3rem" }}
                ></i>
                <p className="text-muted mt-3">
                  Vue chronologique des candidatures (à implémenter)
                </p>
              </div>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="bi bi-x me-1"></i>Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default JobApplicationsManager;
