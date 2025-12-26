import { expect } from "chai";
import { network } from "hardhat";

interface Question {
  question: string;
  options: string[];
}

it("Survey init", async () => {
    const { ethers } = await network.connect();

    const title = "막무가내 설문조사";
	    const description = "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한 자만 볼 수 있습니다.";
	    const questions: Question[] = [{question: "누가 내 응답을 관리할 때 더 솔직할 수 있을까요?", options: ["구글폼 운영자", "탈중앙화된 블록체인 (관리주체 없으며 모든 데이터 공개)", "상관 없음"]}];

	    const factory = await ethers.deployContract("SurveyFactory", [ethers.parseEther("50"), ethers.parseEther("0.1")]);
        const tx = await factory.createSurvey({ title, description, targetNumber: 100, questions }, { value: ethers.parseEther("100") });
        const receipt = await tx.wait();
        
        let surveyAddress;

        receipt?.logs.forEach((log) => {
            try {
                const event = factory.interface.parseLog(log);
                if (event?.name === "SurveyCreated") {
                    surveyAddress = event.args[0];
                }
            } catch {
                // ignore unrelated logs
            }
        });

	    // const survey = await ethers.deployContract("Survey", [title, description, questions]);
	    
        const surveyC = await ethers.getContractFactory("Survey");
        const signers = await ethers.getSigners();
        const respondent = signers[0];

        if (!surveyAddress) throw new Error("Survey address not found in logs");

        const survey = surveyC.attach(surveyAddress).connect(respondent);
        const before = await ethers.provider.getBalance(respondent.address);
        const submitTx = await survey.submitAnswers({ respondent: respondent.address, answers: [1] });
        await submitTx.wait();
        const after = await ethers.provider.getBalance(respondent.address);
        expect(after).gt(before);
});
