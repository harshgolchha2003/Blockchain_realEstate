//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}


contract Escrow {

    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    modifier onlySeller(){
        require(msg.sender==seller,"First become the owner of the property you are trying to sell");
        _;
    }
    modifier onlyBuyer(uint256 _nftID){
        require(msg.sender==buyer[_nftID],"You are late property already sold");
        _;
    }
    modifier minimumamount(uint256 _amount,uint256 _nftID){
        require(_amount>=escrowAmount[_nftID]);
        _;
    }
    modifier onlyInspector(){
        require(msg.sender==inspector,"Only Inspector can do this.");
        _;
    }
    modifier inspectionClear(uint256 _nftID){
        require(inspectionPassed[_nftID],"InspectionClear");
        require(approval[_nftID][buyer[_nftID]],"You are not approved to buy this property");
        require(approval[_nftID][seller],"You are not approved to sell this property");
        require(approval[_nftID][lender],"You are not approved to lend this property");
        _;
    }





    mapping(uint256=>bool) public isListed;
    mapping(uint256=>uint256) public purchasePrice;
    mapping(uint256=>uint256) public escrowAmount;
    mapping(uint256=>address) public buyer;
    mapping(uint256=>bool) public inspectionPassed;
    mapping(uint256=>mapping(address=>bool))public approval;

    constructor(address _nftAddress,address payable _seller,address _inspector,address _lender){
        nftAddress=_nftAddress;
        seller=_seller; 
        inspector=_inspector;
        lender=_lender;
    }
    function list (uint _nftID,address _buyer,uint256 _purchase,uint256 _amount) public payable onlySeller{
        //Transfer of NFT from seller to this contract
            IERC721(nftAddress).transferFrom(msg.sender,address(this),_nftID);
            isListed[_nftID]=true;
            purchasePrice[_nftID]=_purchase;
            buyer[_nftID]=_buyer;
            escrowAmount[_nftID]=_amount;
            
    }

    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) minimumamount(msg.value,_nftID) {}


    function updateInspectionStatus(uint256 _nftID, bool _passed) public onlyInspector{
            inspectionPassed [_nftID] = _passed;
        }
    
    function approveSale(uint _nftID) public{
            approval[_nftID][msg.sender]=true;
    }



    function finalizeSale(uint _nftID) public inspectionClear(_nftID){
       require(address(this).balance>=purchasePrice[_nftID]); 
       (bool paymentSuccessful,)=payable(seller).call{value:address(this).balance}("");
       require(paymentSuccessful);
       IERC721(nftAddress).transferFrom(address(this),buyer[_nftID],_nftID);
    }

    function cancelSale(uint256 _nftID) public {
        if (inspectionPassed[_nftID] == false) {
            payable(buyer[_nftID]).transfer(address(this). balance);
        } 
        else {
            payable(seller).transfer(address(this). balance);
        }
}
    receive() external payable{}

    function getBalance()public view returns(uint256){
        return address(this).balance;
    }
}
