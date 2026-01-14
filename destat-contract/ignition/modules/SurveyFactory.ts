import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

export default buildModule("SurveyFactoryModule", (m) => {
  const surveyFactory = m.contract("SurveyFactory", [
    ethers.parseEther("50"),
    ethers.parseEther("0.5"),
  ]);
  return { surveyFactory };
});

