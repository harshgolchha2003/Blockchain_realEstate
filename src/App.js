import React from 'react';
import ReactDOM from 'react-dom';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Home from './components/Home';
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import "./components/SearchBar.css";

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

const r=1;
function App() {
  const[homes,setHomes]=useState([])
  const[home,setHome]=useState({})
  const [account, setAccount] =useState(null)
  const [provider,setProvider]=useState(null)
  const [escrow,setEscrow]=useState(null)
  const [toggle,setToggle]=useState(false)

  const loadBlockachainData=async()=>{
    const provider=new ethers.providers.Web3Provider(window.ethereum)
    // console.log("aaaaa")
    setProvider(provider)

    const network=await provider.getNetwork()

    const realEstate=new ethers.Contract( config[network.chainId].realEstate.address,RealEstate,provider)
    const totalSupply=await realEstate.total_Supply()
    setHomes([])
    for(let i=1;i<=totalSupply;i++){
      const uri=await realEstate.tokenURI(i);
      const response=await fetch(uri)
      const metadata=await response.json()
      setHomes((prevHomes) => [
        ...prevHomes,
        metadata,
    ]);
    }
    const escrow=new ethers.Contract( config[network.chainId].escrow.address,Escrow,provider)
    setEscrow(escrow);

    window.ethereum.on('accountsChanged',async()=>{
      const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
      const account=ethers.utils.getAddress(accounts[0]);

      setAccount(account)
    })
  }
  useEffect(()=>{
    setHomes([]) 
    loadBlockachainData();
    // return ()=>clearInterval(id);
    

    
  },([]))

  const togglePop=(home)=>{
    setHome(home);
    toggle? setToggle(false):setToggle(true);
  }

  const [search,setSearch]=useState("");
  const [searchHome,setSearchHome]=useState([]);
  const [selectedItem,setSelectedItem]=useState(-1);

  const handleChange=(e)=>{
      setSearch(e.target.value)
  };
  const handleClose=()=>{
      setSearch("");
      setSearchHome([]);
      setSelectedItem(-1);
  };

  const handleKeyDown=(e)=>{
      // console.log(e.key)
    if(selectedItem<searchHome.length)
      {  if(e.key==="ArrowUp"&&selectedItem>0){
          setSelectedItem(prev=>prev-1)
      }
     else if(e.key==="ArrowDown"&&selectedItem<searchHome.length-1){
          setSelectedItem(prev=>prev+1)
      }
      else if (e.key==="Enter"&&selectedItem>=0){
         togglePop(searchHome[selectedItem])
      }}
      else {
          setSelectedItem(-1);
      }

  };
  useEffect(()=>{
      if(search!=="")
      {
         homes.map((home,index)=>{
          if(home.description.includes(search)){
              setSearchHome((prevHomes) => [
                  ...prevHomes,
                  home,
              ]);
          }
         })
      }
  },[search])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount}/>
      <div>
      <section className='search_section'>
            <div className='search_input_div'>
                <input
                    type='text'
                    className='search_input'
                    placeholder='Search...'
                    autoComplete='off'
                    onChange={handleChange}
                    value={search}
                    onKeyDown={handleKeyDown}
                
                />
                
                <div className='search_icon'>
                    <SearchIcon />
                    <CloseIcon onClick={handleClose} />
              
                </div>
            </div>
            <div className='search_result'>
                {
                    searchHome.map((home,index)=>{

                    return <a onClick={()=>togglePop(home)} key={index} target='_blank' className={selectedItem===index?'search_suggestion_line active':'search_suggestion_line'}>
                    {home.name}
                </a>
                    })
                }
            </div>
            
        </section>
      </div>
      <div className='cards__section'>

        <h3>Homes for You</h3>
          <hr/>
        <div className='cards'>
            {homes.map((home,index)=>( 
              
              <div className='card' key={index} onClick={()=>togglePop(home)}>
                <div className='card__image'>
                  <img src={home.image} alt="Home"/>
                </div>

              <div className='card__info'>
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> beds|
                  <strong>{home.attributes[3].value}</strong> bathrooms|
                  <strong>{home.attributes[4].value}</strong>  sqft
                </p>
                <p>{home.address}</p>
              </div>
            </div>
              ))}  
        </div>
      </div>
      {toggle &&(<Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop}/>)
      }
  </div>
  );
}

export default App;
