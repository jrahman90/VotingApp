// VotingPage.jsx

import React, { useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { BrowserRouter as Router } from "react-router-dom";

import candidatesData from "./candidatesData.json";

const { positions, dummyCandidates } = candidatesData;

const VotingPage = () => {
  const [votes, setVotes] = useState({});
  const [selectedCandidates, setSelectedCandidates] = useState({}); // Add this line
  const [candidateVotes, setCandidateVotes] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleVote = (candidateId, position) => {
    setVotes((prevVotes) => {
      const newVotes = { ...prevVotes };
      if (newVotes[position] === candidateId) {
        newVotes[position] = undefined;
      } else {
        newVotes[position] = candidateId;
      }
      return newVotes;
    });
  };

  const handleSelectAll = (panelName) => {
    const selectedCandidates = {};
    dummyCandidates.forEach((panelData) => {
      if (panelData.panelName === panelName) {
        positions.forEach((position) => {
          const candidate = panelData.candidates.find(
            (c) => c.position === position
          );
          if (candidate) {
            selectedCandidates[position] = candidate.id;
          }
        });
      }
    });
    setVotes(selectedCandidates);
  };

  const handleClearVotes = () => {
    setVotes({});
  };

  const handleSubmitVotes = () => {
    let newTotalVotes = totalVotes + 1;
    setTotalVotes(newTotalVotes);

    const selectedCandidatesInfo = {};

    positions.forEach((position) => {
      const candidateId = votes[position];
      if (candidateId) {
        setCandidateVotes((prevVotes) => ({
          ...prevVotes,
          [position]: {
            ...(prevVotes[position] || {}),
            [candidateId]: (prevVotes[position]?.[candidateId] || 0) + 1,
          },
        }));

        selectedCandidatesInfo[position] = {
          id: candidateId,
          name: dummyCandidates
            .flatMap((panelData) => panelData.candidates)
            .find((candidate) => candidate.id === candidateId)?.name,
        };
      }
    });

    setSelectedCandidates(selectedCandidatesInfo);

    handleClearVotes(); // Clear votes after submission
  };

  const handleShowResults = () => {
    showResults ? setShowResults(false) : setShowResults(true);
  };

  const handleClearCounts = () => {
    setCandidateVotes({});
    setTotalVotes(0);
    setShowResults(false); // Hide results after clearing counts
  };

  return (
    <Router>
      <Container>
        <h1 className="text-center mt-4 mb-4">Voting Page</h1>
        <Row>
          {dummyCandidates.map((panelData, index) => (
            <Col key={index} md={4}>
              <Card className="mb-4">
                <Card.Header
                  style={{
                    background: panelData.panelColor,
                    color: panelData.textColor,
                  }}
                >
                  <h2 className="text-center">
                    <img
                      style={{ maxHeight: "40px", marginRight: "10px" }}
                      src={panelData.img}
                    />
                    {panelData.panelName}{" "}
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleSelectAll(panelData.panelName)}
                    >
                      Select All
                    </Button>
                  </h2>
                </Card.Header>
                <Card.Body>
                  {positions.map((position) => (
                    <PositionPanel
                      key={position}
                      position={position}
                      candidates={panelData.candidates || []}
                      onVote={(candidateId) =>
                        handleVote(candidateId, position)
                      }
                      selectedCandidateId={votes[position]}
                    />
                  ))}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-center">
          <Button variant="primary" onClick={handleSubmitVotes}>
            Submit Votes
          </Button>{" "}
          <Button variant="danger" onClick={handleClearVotes}>
            Clear Votes
          </Button>
        </div>
        <div className="text-center mt-1">
          <Button variant="primary" onClick={handleShowResults}>
            Show Results
          </Button>
        </div>
        {showResults && (
          <div className="mt-4">
            <h2 className="text-center">Candidate Vote Counts</h2>
            {positions.map((position) => (
              <div key={position} className="mb-4">
                <h3 className="text-center">{position}</h3>
                <Row className="text-center">
                  {dummyCandidates
                    .flatMap((panelData) => panelData.candidates)
                    .filter((candidate) => candidate.position === position)
                    .map((candidate) => (
                      <Col key={candidate.id}>
                        <p>
                          {candidate.name}:{" "}
                          {candidateVotes[position]?.[candidate.id] || 0}
                        </p>
                      </Col>
                    ))}
                </Row>
              </div>
            ))}
            <div className="text-center">
              <Button variant="danger" onClick={handleClearCounts}>
                Clear Counts
              </Button>
            </div>
            <div className="mt-4">
              <h2 className="text-center">Total Votes</h2>
              <p className="text-center">{totalVotes}</p>
            </div>
          </div>
        )}
      </Container>
    </Router>
  );
};

const PositionPanel = ({
  position,
  candidates,
  onVote,
  selectedCandidateId,
}) => {
  return (
    <div>
      <h3 className="text-center mb-3">{position}</h3>
      {candidates.length > 0 ? (
        candidates
          .filter((candidate) => candidate.position === position)
          .map((candidate) => (
            <CandidateRectangle
              key={candidate.id}
              candidate={candidate}
              onClick={() => onVote(candidate.id)}
              selected={selectedCandidateId === candidate.id}
            />
          ))
      ) : (
        <p className="text-center">No candidates available</p>
      )}
    </div>
  );
};

const CandidateRectangle = ({ candidate, onClick, selected }) => {
  const rectangleStyle = {
    width: "150px", // Adjust the width as needed
    height: "80px", // Adjust the height as needed
    backgroundColor: selected ? "blue" : candidate.panelColor,
    color: selected ? "white" : "black", // Change text color to white when selected
    border: "1px solid black",
    margin: "5px",
    textAlign: "center",
    lineHeight: "80px",
    borderRadius: "10px", // Add rounded corners
    cursor: "pointer", // Add cursor style
  };

  return (
    <div style={rectangleStyle} onClick={onClick}>
      {candidate.name}
    </div>
  );
};

export default VotingPage;
