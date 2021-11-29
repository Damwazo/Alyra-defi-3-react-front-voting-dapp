import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Form, Row, Col, Card, Container } from "react-bootstrap";

/*
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col"; 
*/
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = {
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
    owner: null,
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      web3.eth.handleRevert = true;

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Voting.networks[networkId];
      const instance = new web3.eth.Contract(
        Voting.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runRestart);
      const contractOwner = await this.affectOwner();
      this.setState({ owner: contractOwner });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  runRestart = async () => {
    window.ethereum.on("accountsChanged", function (accounts) {
      window.location.href = "http://localhost:3000";
    });
  };

  // 1 -  Enregistrement d'une liste blanche d'électeurs
  addVoter = async () => {
    const { accounts, contract } = this.state;
    const address = this.address.value;

    // Interagir avec le smart contract pour ajouter l'électeur
    try {
      await contract.methods.addVoter(address).send({ from: accounts[0] });
    } catch (e) {
      console.log("Erreur: Impossible d'ajouter l'électeur");
    }
  };

  // 2 - l'administrateur commence la session d'enregistrement de la proposition
  startProposalsRegistering = async () => {
    const { accounts, contract } = this.state;
    // Connexion smart contract pour démarrer l'enregistrement des propositions
    try {
      await contract.methods
        .startProposalsRegistering()
        .send({ from: accounts[0] });
    } catch (e) {
      console.log(
        e,
        "Erreur: Impossible de démarrer la session d'enregistrement des propositions"
      );
    }
  };

  // 3 - Les électeurs inscrits enregistrent leurs propositions
  addProposal = async () => {
    const { accounts, contract } = this.state;
    // Connexion smart contract pour l'enregistrement des propositions
    try {
      await contract.methods
        .addProposal(document.getElementById("_desc").value)
        .send({ from: accounts[0] });
    } catch (e) {
      console.log(
        e,
        "Erreur: Impossible d'enregistrer les propositions des électeurs"
      );
    }
  };

  // 4 - L'administrateur met fin à la session d'enregistrement des propositions
  endProposalsRegistering = async () => {
    const { accounts, contract } = this.state;
    // Connection smart contract : Arrêt enregistrement des propositions
    try {
      await contract.methods
        .endProposalsRegistering()
        .send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur: Impossible d'arrêter la session de propositions");
    }
  };

  // 5 - L'administrateur commence la session de vote
  startVotingSession = async () => {
    const { accounts, contract } = this.state;
    // Connexion smart contract : démarrage session vote
    try {
      await contract.methods.startVotingSession().send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur: Impossible de démarrer la session de vote");
    }
  };

  // 6 - Les électeurs inscrits votent pour leurs propositions préférées
  setVote = async () => {
    const { accounts, contract } = this.state;
    // Connexion smart contract : Les élécteurs votent
    try {
      await contract.methods
        .setVote(document.getElementById("_id").value)
        .send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur: Les électeurs ne peuvent pas voter");
    }
  };

  // 7 - L'administrateur met fin à la session de vote
  endVotingSession = async () => {
    const { accounts, contract } = this.state;
    // Interaction smart contract : Terminer la session de vote par l'admmin
    try {
      await contract.methods.endVotingSession().send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur: Impossible d'arrêter la session de vote");
    }
  };

  // 8 - L'administrateur comptabilise les votes
  tallyVotes = async () => {
    const { accounts, contract } = this.state;
    // Interaction smart contract : comptage de votes
    try {
      await contract.methods.tallyVotes().send({ from: accounts[0] });
    } catch (e) {
      console.log(e, "Erreur: Impossible de comptabiliser les votes");
    }
  };

  // 9 - Tout le monde peut consulter le résultat
  getWinner = async () => {
    const { accounts, contract } = this.state;
    // Interaction avec le smart contract : Donner la proposition gagnante
    try {
      const text = document.createTextNode(
        "Proposition Gagnante : " +
          (await contract.methods.getWinner().call({ from: accounts[0] }))
      );
      const newP = document.createElement("p");
      newP.appendChild(text);
      document.getElementById("winnerInfo").appendChild(newP);
    } catch (e) {
      console.log(e, "Erreur: Impossible d'afficher la proposition gagnante");
    }
  };

  // Affichage des propositions

  getOwner = function () {
    const { contract } = this.state;
    return new Promise(function (resolve) {
      resolve(contract.methods.owner().call());
    });
  };

  affectOwner = async () => {
    var result = await this.getOwner();
    return result;
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    //Vue Administrateur
    if (
      String(this.state.owner).toLowerCase() ===
      String(this.state.accounts[0]).toLowerCase()
    ) {
      return (
        <div className="App">
          <div>
            <h2 className="text-center title">Système de vote</h2>
            <p className="text-center" id="userAddress">
              Adresse de l'utilisateur : {this.state.accounts[0]}
            </p>
            <hr></hr>
          </div>
          <Container>
            <Row>
              <Col>
                <h3>Administrateur</h3>
                <Card className="m-2 mt-4">
                  <Card.Header>
                    <strong>
                      Ajouter un nouveau compte à la liste blanche
                    </strong>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group controlId="formAddress">
                      <Form.Label>Adresse de l'utilisateur : </Form.Label>
                      <Form.Control
                        type="text"
                        id="address"
                        ref={(input) => {
                          this.address = input;
                        }}
                        className="input"
                      />
                    </Form.Group>
                    <Button
                      onClick={this.addVoter}
                      variant="dark"
                      className="button"
                    >
                      {" "}
                      Autoriser{" "}
                    </Button>
                  </Card.Body>
                </Card>

                <Card className="m-2">
                  <Card.Header>
                    <strong>Démarrer l'enregistrement des propositions</strong>
                  </Card.Header>
                  <Card.Body>
                    <Button
                      onClick={this.startProposalsRegistering}
                      variant="dark"
                      className="button"
                    >
                      {" "}
                      Démarrer{" "}
                    </Button>
                  </Card.Body>
                </Card>

                <Card className="m-2">
                  <Card.Header>
                    <strong>Terminer l'enregistrement des propositions</strong>
                  </Card.Header>
                  <Card.Body>
                    <Button
                      onClick={this.endProposalsRegistering}
                      variant="dark"
                      className="button"
                    >
                      {" "}
                      Terminer{" "}
                    </Button>
                  </Card.Body>
                </Card>

                <Card className="m-2">
                  <Card.Header>
                    <strong>Démarrer la session de vote</strong>
                  </Card.Header>
                  <Card.Body>
                    <Button
                      onClick={this.startVotingSession}
                      variant="dark"
                      className="button"
                    >
                      {" "}
                      Démarrer{" "}
                    </Button>
                  </Card.Body>
                </Card>

                <Card className="m-2">
                  <Card.Header>
                    <strong>Terminer la session de vote</strong>
                  </Card.Header>
                  <Card.Body>
                    <Button
                      onClick={this.endVotingSession}
                      variant="dark"
                      className="button"
                    >
                      {" "}
                      Terminer{" "}
                    </Button>
                  </Card.Body>
                </Card>

                <Card className="m-2">
                  <Card.Header>
                    <strong>Calculer les résultats</strong>
                  </Card.Header>
                  <Card.Body>
                    <Button
                      onClick={this.tallyVotes}
                      variant="dark"
                      className="button"
                    >
                      {" "}
                      Calculer{" "}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col>
                <h3>Utilisateur</h3>
                <Card className="m-2 mt-4">
                  <Card.Header>
                    <strong>Ajouter une proposition</strong>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group controlId="formDescription">
                      <Form.Label>Description de la proposition : </Form.Label>
                      <Form.Control type="text" id="_desc" className="input" />
                    </Form.Group>
                    <Button
                      onClick={this.addProposal}
                      variant="dark"
                      className="button"
                    >
                      {" "}
                      Ajouter{" "}
                    </Button>
                  </Card.Body>
                </Card>

                <Card className="m-2">
                  <Card.Header>
                    <strong>Vote</strong>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group controlId="formId">
                      <Form.Label>ID de la proposition : </Form.Label>
                      <Form.Control type="text" id="_id" className="input" />
                    </Form.Group>
                    <Button
                      onClick={this.setVote}
                      variant="dark"
                      className="button"
                    >
                      {" "}
                      Voter{" "}
                    </Button>
                  </Card.Body>
                </Card>

                <Card className="m-2">
                  <Card.Header>
                    <strong>Résultats</strong>
                  </Card.Header>
                  <Card.Body id="winnerInfo">
                    <Button
                      onClick={this.getWinner}
                      variant="dark"
                      className="button"
                    >
                      {" "}
                      Obtenir les résultats{" "}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>

          <br></br>
        </div>
      );
    }

    //Vue Electeur
    if (
      String(this.state.owner).toLowerCase() !==
      String(this.state.accounts[0]).toLowerCase()
    ) {
      return (
        <div className="App">
          <div>
            <h2 className="text-center title">Système de vote</h2>
            <p className="text-center" id="userAddress">
              Adresse de l'utilisateur : {this.state.accounts[0]}
            </p>
            <hr></hr>
          </div>

          <Container>
            <Col>
              <Row>
                <Col></Col>
                <Col>
                  <Card>
                    <Card.Header>
                      <strong>Ajouter une proposition</strong>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group controlId="formDescription">
                        <Form.Label>
                          Description de la proposition :{" "}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          id="_desc"
                          className="input"
                        />
                      </Form.Group>
                      <Button
                        onClick={this.addProposal}
                        variant="dark"
                        className="button"
                      >
                        {" "}
                        Ajouter{" "}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col></Col>
              </Row>

              <Row>
                <Col></Col>
                <Col>
                  <Card>
                    <Card.Header>
                      <strong>Vote</strong>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group controlId="formId">
                        <Form.Label>ID de la proposition : </Form.Label>
                        <Form.Control type="text" id="_id" className="input" />
                      </Form.Group>
                      <Button
                        onClick={this.setVote}
                        variant="dark"
                        className="button"
                      >
                        {" "}
                        Voter{" "}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col></Col>
              </Row>

              <Row>
                <Col></Col>
                <Col>
                  <Card>
                    <Card.Header>
                      <strong>Résultats</strong>
                    </Card.Header>
                    <Card.Body id="winnerInfo">
                      <Button
                        onClick={this.getWinner}
                        variant="dark"
                        className="button"
                      >
                        {" "}
                        Obtenir les résultats{" "}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col></Col>
              </Row>
            </Col>
          </Container>

          <br></br>
        </div>
      );
    }
  }
}

export default App;
