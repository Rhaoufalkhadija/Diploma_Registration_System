async function main() {
    const Diploma = await ethers.getContractFactory("DiplomaRegistry");
    const diploma = await Diploma.deploy();
    await diploma.waitForDeployment();
    console.log("Contract deployed to:", await diploma.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});