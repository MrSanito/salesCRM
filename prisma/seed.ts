import { PrismaClient, Role, LeadStage, LeadPriority, LeadSubStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL!
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

// ── Company data ────────────────────────────────────────────────────────────
const companies = [
  // ── Software – Ahmedabad ──────────────────────────────────────────────────
  { name: 'Spectrics Solution',          industry: 'Software',          city: 'Ahmedabad',  address: 'The Capital 2, 913, Science City Rd, Sola, Ahmedabad, Gujarat 380060',                                                                                                    phone: '9974804587'  },
  { name: 'Websys Infotech',             industry: 'Software',          city: 'Ahmedabad',  address: 'Galaxy Complex, A-4th Floor, Chimanlal Girdharlal Rd, opp. National Handloom, Ahmedabad, Gujarat 380006',                                                                  phone: '9228312782'  },
  { name: '360 Degree Technosoft',       industry: 'Software',          city: 'Ahmedabad',  address: '101, Chimanlal Girdharlal Rd, near Sardar Patel Seva Samaj, opp. Induben Khakhrawala, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380006',                                 phone: '9081888816'  },
  { name: 'Universal Software',          industry: 'Software',          city: 'Ahmedabad',  address: '4, Ramya, Polytechnic Road, Opp Ketav Petrol Pump, Ambawadi, Ahmedabad, Gujarat 380015',                                                                                   phone: '6357111362'  },
  { name: 'Techtic Technolab',           industry: 'Software',          city: 'Ahmedabad',  address: '12th Floor, Aaryan WorkSpaces 2, BRTS Stop, Gulbai Tekra Rd, opp. Vasundhara Society, Navrangpura, Ahmedabad, Gujarat 380015',                                             phone: '7926463590'  },
  { name: 'JSTECHNO Solution',           industry: 'Software',          city: 'Ahmedabad',  address: '901, Silicon Tower Above Freezeland Near National Handloom, near law garden, Ellisbridge, Ahmedabad, Gujarat 380006',                                                      phone: '9924927267'  },
  { name: 'Third Rock Techno',           industry: 'Software',          city: 'Ahmedabad',  address: 'Sarita Complex, 103, Chimanlal Girdharlal Rd, opp. FLH 3, nr. KB Dresswala, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380006',                                         phone: '9712209416'  },
  { name: 'Cyznet.one',                  industry: 'Software',          city: 'Ahmedabad',  address: '2nd Floor, The Textile Association (India), Dinesh Hall, Ashram Rd, Shreyas Colony, Navrangpura, Ahmedabad, Gujarat 380009',                                               phone: '6358976018'  },
  { name: 'SMG Infosolution',            industry: 'Software',          city: 'Ahmedabad',  address: 'Satkar Complex, 501, Chimanlal Girdharlal Rd, near Lal Bunglow, New Commercial Mills Staff Society, Ellisbridge, Ahmedabad, Gujarat 380006',                               phone: '9898067783'  },
  { name: 'Height8 Technologies',        industry: 'Software',          city: 'Ahmedabad',  address: 'Swagat Complex, 501-502, Chimanlal Girdharlal Rd, near Lal Bunglow, Navrangpura, Ahmedabad, Gujarat 380006',                                                               phone: '6358931775'  },
  { name: 'WeblineIndia',                industry: 'Software',          city: 'Ahmedabad',  address: 'Citius Commercial Spaces, 401, opp. Amc Multilevel Parking, nr. Havmor Restaurant, Navrangpura, Ahmedabad, Gujarat 380009',                                                phone: '7926420897'  },
  { name: 'Invidious Software Solution', industry: 'Software',          city: 'Ahmedabad',  address: 'Prahlad Nagar, Ahmedabad, Gujarat 380015',                                                                                                                                  phone: '7940081681'  },
  { name: 'Indexture Solutions',         industry: 'Software',          city: 'Ahmedabad',  address: 'T-Junction, 405, One World West Ambli, Sardar Patel Ring Rd, Bopal, Ahmedabad, Gujarat 380058',                                                                            phone: '9054409426'  },
  { name: 'Equest Solutions',            industry: 'Software',          city: 'Ahmedabad',  address: '1305-1312 SKD Surya Icon 132 Feet Ring Road, AEC Cross Rd, opp. Torrent Power, Naranpura, Ahmedabad, Gujarat 380013',                                                      phone: '7940059475'  },
  { name: 'Vnurture Technologies',       industry: 'Software',          city: 'Ahmedabad',  address: '401, Shivalik 5, Mahalaxmi Cross road, Paldi, Ahmedabad, Gujarat 380007',                                                                                                  phone: '9558819097'  },
  { name: 'Safal Infortech',             industry: 'Software',          city: 'Ahmedabad',  address: 'Second Floor, Kameshwar Vihar Bungalows, SHIVALIK CORPORATE PARK 204-204A & 205-205A, B Wing, opp. Ashwamedh, Satellite, Ahmedabad, Gujarat 380015',                       phone: '18008907123' },
  { name: 'Shreepati Systems',           industry: 'Software',          city: 'Ahmedabad',  address: 'Sakar V, Ashram Rd, Ellisbridge, Ahmedabad, Gujarat 380009',                                                                                                               phone: '9712224882'  },
  { name: 'Quarec IT Solutions',         industry: 'Software',          city: 'Ahmedabad',  address: '615, Sakar-9, 2, Ashram Rd, beside Old Reserve Bank of India, Muslim Society, Navrangpura, Ahmedabad, Gujarat 380009',                                                     phone: '9699656667'  },
  { name: 'Tmedia Business Solution',    industry: 'Software',          city: 'Ahmedabad',  address: 'A/1213, Ratnakar Nine Square, Nr Keshavbaug Party Plot, Vastrapur, Ahmedabad, Gujarat 380015',                                                                             phone: '7948929022'  },
  { name: 'MSP IT Concepts',             industry: 'Software',          city: 'Ahmedabad',  address: 'Gala Argos, 101, nr. Harikrupa Tower, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                                             phone: '7940304588'  },
  { name: 'Hetfy Software Solutions',    industry: 'Software',          city: 'Ahmedabad',  address: '906-908, Videocon Arizona, Ahmedabad, Gujarat 380009',                                                                                                                      phone: '7041468677'  },
  { name: 'Technobrains Software',       industry: 'Software',          city: 'Ahmedabad',  address: '503, Mauryansh Elanza, Shyamal Cross Rd, near Parekh Hospital, Satellite, Ahmedabad, Gujarat 380015',                                                                      phone: '9664627548'  },
  { name: 'Maruti Techlabs',             industry: 'Software',          city: 'Ahmedabad',  address: '10th Floor, The Ridge, Iskcon Cross Rd, opp. Novotel, Sanidhya, Ahmedabad, Gujarat 380060',                                                                                phone: null          },
  { name: 'Xcode Web Solutions',         industry: 'Software',          city: 'Ahmedabad',  address: '1237, 1238 - 12th floor, Shyamal Cross Rd, Rajmani Society, Shyamal, Ahmedabad, Gujarat 380015',                                                                           phone: '9023035541'  },
  { name: 'JVS Technologies',            industry: 'Software',          city: 'Ahmedabad',  address: 'A-401, Ganesh Plaza, Nr. Navrangpura Post Office, Navrangpura, Ahmedabad, Gujarat 380009',                                                                                  phone: '9099903149'  },
  { name: 'The Bridge Code',             industry: 'Software',          city: 'Ahmedabad',  address: '406, Shanti House, Chimanlal Girdharlal Rd, near Madhusudan House, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380006',                                                     phone: '7984909172'  },
  { name: 'Discus Business Solution',    industry: 'Software',          city: 'Ahmedabad',  address: 'Building, Level 1, Saprem, Udhyan Marg, Ahmedabad, Gujarat 380006',                                                                                                         phone: '7567012222'  },
  { name: 'Softclinic Software',         industry: 'Software',          city: 'Ahmedabad',  address: 'Ganesh Plaza, A-401, Shrimali Society, Navrangpura, Ahmedabad, Gujarat 380009',                                                                                             phone: '9099903149'  },
  { name: 'Sinon Tech',                  industry: 'Software',          city: 'Ahmedabad',  address: '305, ABC-1, Umashankar Joshi Marg, Navrangpura, Ahmedabad, Gujarat 380006',                                                                                                 phone: '8141374997'  },
  { name: 'Whiz Solutions',              industry: 'Software',          city: 'Ahmedabad',  address: '302, Kalapurnam Complex, Chimanlal Girdharlal Rd, near Municipal Market, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380009',                                               phone: '8780595344'  },
  { name: 'Hub Resolution',              industry: 'Software',          city: 'Ahmedabad',  address: '502, Sakar-9, Ashram Rd, beside old Reserve Bank of India, near City Gold, Muslim Society, Navrangpura, Ahmedabad, Gujarat 380009',                                         phone: '6355551989'  },
  { name: 'Awaaz De Infosystem',         industry: 'Software',          city: 'Ahmedabad',  address: '104, Shanay-II, Ashram Rd, opp. Ashram Road, behind Emerald Honda Service Center, Ellisbridge, Ahmedabad, Gujarat 380009',                                                  phone: '7946048373'  },
  { name: 'Auxano Global Solution',      industry: 'Software',          city: 'Ahmedabad',  address: 'B-434/435, Sakar-7, Nehru Bridge, Corner, Ashram Rd, Ahmedabad, Gujarat 380009',                                                                                           phone: '7567567994'  },
  { name: 'STAD Solutions',              industry: 'Software',          city: 'Ahmedabad',  address: '811 - Addor Aspire University Road, Nr. L D Engineering College Hostel, opp. Old Passport Office, Ahmedabad, Gujarat 380015',                                              phone: '7573055577'  },
  { name: 'Perigeon Software',           industry: 'Software',          city: 'Ahmedabad',  address: '403, Priviera, nr. Nehru Nagar Circle, Patel Colony, Ambawadi, Ahmedabad, Gujarat 380015',                                                                                  phone: '6357497151'  },
  { name: 'Excellent Webworld',          industry: 'Software',          city: 'Ahmedabad',  address: '1301-1307, iSquare, Shukan Cross Road, Science City Rd, Sola, Ahmedabad, Gujarat 380060',                                                                                   phone: '8160959859'  },
  { name: 'Ncode Technologies',          industry: 'Software',          city: 'Ahmedabad',  address: '302, Shoppers Plaza, 4, Chimanlal Girdharlal Rd, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380006',                                                                       phone: '9737376131'  },
  { name: 'Profit-NX',                   industry: 'Software',          city: 'Ahmedabad',  address: '806, Kaivanna, Next to Ahmedabad Central Mall, Near Centre Point, Panchwati, Ahmedabad, Gujarat 380006',                                                                   phone: '9426804535'  },
  { name: 'Dash Technologies',           industry: 'Software',          city: 'Ahmedabad',  address: '14th Floor, Krupal Pathshala City Centre, 1401-1452, opp. Chinubhai Tower, near Kheti Bank, Ellisbridge, Ahmedabad, Gujarat 380009',                                       phone: null          },
  { name: 'Netsurf Communication',       industry: 'Software',          city: 'Ahmedabad',  address: 'Office No 5 & 105, BVR Ek, opp. Gujarat College Road, nr. Underpass, Ellisbridge, Ahmedabad, Gujarat 380006',                                                              phone: '7940038000'  },
  { name: 'Lewonit Technology',          industry: 'Software',          city: 'Ahmedabad',  address: '5th Floor, Gala Argos, Netaji Rd, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                                                  phone: null          },
  { name: 'Techstub',                    industry: 'Software',          city: 'Ahmedabad',  address: 'The First B/H, Keshavbaug Party Plot, A-701, Vastrapur, Ahmedabad, Gujarat 380015',                                                                                         phone: '7940050032'  },
  { name: 'Polyxer System',              industry: 'Software',          city: 'Ahmedabad',  address: '202, 2nd Floor, Parishram Complex, 5, Rashmi Society, Navrangpura, Ahmedabad, Gujarat 380009',                                                                              phone: '7926409959'  },
  { name: 'Xduce',                       industry: 'Software',          city: 'Ahmedabad',  address: '7th Floor, Third Eye - Three, Umashankar Joshi Marg, Navrangpura, Ahmedabad, Gujarat 380006',                                                                               phone: '7324659100'  },
  { name: 'Datanot ERP Software Solution', industry: 'Software',       city: 'Ahmedabad',  address: 'Madhuvrund Society Part-1, Second Floor, B Wing SHIVALIK CORPORATE PARK, 204-204A & 205-205A, opp. Ashwamedh Banglows, Satellite, Ahmedabad, Gujarat 380013',              phone: null          },
  { name: 'New Way Traders Smart Billing', industry: 'Software',       city: 'Ahmedabad',  address: 'Hare Krishna Complex, 8-LL, opp. Kothawala Flats, Pritam Nagar, Paldi, Ahmedabad, Gujarat 380006',                                                                          phone: '9824051360'  },
  { name: 'CIMCOM Automation',           industry: 'Software',          city: 'Ahmedabad',  address: '802, SAKAR IV, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                                                                     phone: '7815126210'  },

  // ── Software – Gandhinagar ────────────────────────────────────────────────
  { name: 'Biziverse',                   industry: 'Software',          city: 'Gandhinagar', address: 'A/44, GIDC Electronic Estate, Peach Campus, Gandhinagar, Gujarat 382016',                                                                                                  phone: '8469966996'  },
  { name: 'Accelpix Solutions',          industry: 'Software',          city: 'Gandhinagar', address: '404, Siddhraj Zori, Sargasan Cross Rd, Vasana Hadmatia, Gandhinagar, Gujarat 382419',                                                                                      phone: '9909993349'  },
  { name: 'Prismatric Technologies',     industry: 'Software',          city: 'Gandhinagar', address: '1, 604, IT Tower, near Ch-0 Circle, Infocity, Gandhinagar, Gujarat 382007',                                                                                                phone: '7043308535'  },

  // ── Digital Marketing – Ahmedabad ─────────────────────────────────────────
  { name: 'Clients Now Technologies',    industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Titanium Business Park, A 510, near Makarba, behind Sammet Platinum, Makarba, Ahmedabad, Gujarat 380051',                                                                   phone: '8968027027'  },
  { name: 'WIT Solution',                industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'E/415, Sumel Business Park -7 Nr. Soni Ni Chal, Cross Road, N.H. 8, Rakhial, Ahmedabad, Gujarat 382350',                                                                   phone: '7984856601'  },
  { name: 'AONE SEO',                    industry: 'Digital Marketing', city: 'Ahmedabad',  address: '1111-1112, 11th Floor, Satyamev Elite Ambli-Bopal, Vakil Saheb Brg, T Junction, Ahmedabad, Gujarat 380058',                                                                phone: '8101118111'  },
  { name: 'SEO Tape',                    industry: 'Digital Marketing', city: 'Ahmedabad',  address: '1223, Iconic Shyamal, Shyamal Cross Rd, Satellite, Ahmedabad, Gujarat 380015',                                                                                             phone: '7778896345'  },
  { name: 'Channelpro Communications',   industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Sanand Cross Road, B-509, WTT (World Trade Tower), Sarkhej - Gandhinagar Hwy, nr. Sarkhej, Makarba, Ahmedabad, Gujarat 382210',                                            phone: '7043254533'  },
  { name: 'Indylogix',                   industry: 'Digital Marketing', city: 'Ahmedabad',  address: '406-408, Ashram Rd, opp. Sanyas, Ellisbridge, Ahmedabad, Gujarat 380009',                                                                                                   phone: '7574816161'  },
  { name: 'Chimplab Advertising',        industry: 'Digital Marketing', city: 'Ahmedabad',  address: '414A, Near, Vijay Cross Rd, Roads, Navrangpura, Ahmedabad, Gujarat 380009',                                                                                                 phone: '9724424477'  },
  { name: 'Apollo Infotech',             industry: 'Digital Marketing', city: 'Ahmedabad',  address: '1, Anurag Flats, Bhairav Nath Cross Rd, Maninagar, Ahmedabad, Gujarat 380028',                                                                                              phone: '9824773136'  },
  { name: 'Wolfable',                    industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Commerce Six Complex, 705-706, Commerce Six Rd, near Samved Hospital, opp. Metro Pillar Number 196, Navrangpura, Ahmedabad, Gujarat 380009',                                phone: '8511393399'  },
  { name: 'Brand Height',                industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Prahladnagar Trade Center, Time of India, D-1102, Press Road, Vejalpur, Ahmedabad, Gujarat 380051',                                                                        phone: '9909630090'  },
  { name: 'Webserx',                     industry: 'Digital Marketing', city: 'Ahmedabad',  address: '309, Venus Amadeus, Jodhpur Cross Rd, Satellite, Ahmedabad, Gujarat 380015',                                                                                                phone: '9586650402'  },
  { name: 'Web999',                      industry: 'Digital Marketing', city: 'Ahmedabad',  address: '325, Vishwesh Tower, Parshwanath Society, Sundar Nagar, Naranpura, Ahmedabad, Gujarat 380013',                                                                              phone: '9904434226'  },
  { name: 'Moreweb Solutions',           industry: 'Digital Marketing', city: 'Ahmedabad',  address: '6th Floor, Solaris Business Hub, nr. Bhuyangdev Cross Road, Vardhmannagar Society, C.P. Nagar-1, Ahmedabad, Gujarat 380063',                                               phone: '8733027606'  },
  { name: 'Shartor',                     industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'B/h. Kochrab, 414, Ashram Avenue, Vishwakunj Cross Rd, near Paldi, Ashram, Ahmedabad, Gujarat 380006',                                                                     phone: '9662755766'  },
  { name: '13 Utopia',                   industry: 'Digital Marketing', city: 'Ahmedabad',  address: '13 UTOPiA - 1123, Iconic Shyamal, Shyamal Cross Roads, 132 Feet Ring Rd, Nehru Nagar, Shyamal, Ahmedabad, Gujarat 380015',                                                  phone: '9924131397'  },
  { name: 'Artista Group',               industry: 'Digital Marketing', city: 'Ahmedabad',  address: '7th Floor, 714, Iscon Emporio, Jodhpur Cross Rd, near Star Bazar, Satellite, Ahmedabad, Gujarat 380015',                                                                    phone: '8320066286'  },
  { name: 'Digital Big Bull',            industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Building, 407, Commerce Six Rd, near Samved Hospital, Girivar Society, Navrangpura, Ahmedabad, Gujarat 380009',                                                             phone: '9510731596'  },
  { name: 'Squirrel Wiz Technology',     industry: 'Digital Marketing', city: 'Ahmedabad',  address: '402, Aaryan Work Spaces, St. Xavier\'s College Corner, Navrangpura, Ahmedabad, Gujarat 380006',                                                                             phone: '9909905253'  },
  { name: 'Rexmyze Group',               industry: 'Digital Marketing', city: 'Ahmedabad',  address: '8th Floor, B112, Sarover Complex, opposite Samruddhi Apartment, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380009',                                                      phone: '8735881126'  },
  { name: 'Flying Lion Media',           industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'BBC Tower, 602, near Netaji Road, opp. Mayor\'s House, Navrangpura, Ahmedabad, Gujarat 380006',                                                                             phone: '9313565492'  },
  { name: 'Just Now',                    industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Besides Videocon Arizona, Navgujarat College Of Computer Applications, 207/208, Ashram Rd, Usmanpura, Ahmedabad, Gujarat 380009',                                           phone: '8320623150'  },
  { name: '8webcom',                     industry: 'Digital Marketing', city: 'Ahmedabad',  address: '5th Floor, 503, Sun Gravitas, Near, Shyamal Cross Rd, opp. Ganesh Gruh Udyog, Rajmani Society, Satellite, Ahmedabad, Gujarat 380015',                                       phone: '9727700459'  },
  { name: 'Digital Mambas',              industry: 'Digital Marketing', city: 'Ahmedabad',  address: '4th Floor, Agrawal Complex, Chimanlal Girdharlal Rd, near Municipal Market, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380009',                                            phone: '8866743733'  },
  { name: 'Matic Solutions',             industry: 'Digital Marketing', city: 'Ahmedabad',  address: '207, Aaryan Work Spaces, St. Xavier\'s College Corner, Navrangpura, Ahmedabad, Gujarat 380006',                                                                             phone: '9879872727'  },
  { name: 'Monk Media One',              industry: 'Digital Marketing', city: 'Ahmedabad',  address: '720, Shyamal Cross Rd, Rajmani Society, Shyamal, Ahmedabad, Gujarat 380015',                                                                                                phone: '8866819349'  },
  { name: 'Valuable Multimedia Marketing', industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Nalanda Enclave, 408, opp. Sudama Resort, Pritam Nagar, Paldi, Ahmedabad, Gujarat 380006',                                                                                phone: '9016850552'  },
  { name: 'EEG Technogeeks',             industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Unicus, B-805, Shyamal Cross Rd, opp. Iconic Shyamal, Balgayatri Society Part-2, Satellite, Shyamal, Ahmedabad, Gujarat 380015',                                           phone: '7600203454'  },
  { name: 'Netsavvies Media',            industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Sakar 4, M/F 4-5, opp. Town Hall, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                                                 phone: '9033666898'  },
  { name: 'IMI Advertising',             industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Titanium City Center Mall, F 803-804, 100 Feet Rd, Satellite, Ahmedabad, Gujarat 380015',                                                                                   phone: '9313100658'  },
  { name: 'Netclues India',              industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Jhansi Ki Rani, Stratum @ Venus Grounds, 1320, 13th Floor East Wing, Surendra Mangaldas Rd, Nehru Nagar, Satellite, Ahmedabad, Gujarat 380015',                            phone: '7966637443'  },
  { name: 'Bhagya Web Technologies',     industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Vraj Shanti Appartment, Jain Merchant Cross Rd, Fatehpura, Paldi, Ahmedabad, Gujarat 380007',                                                                               phone: '9537315148'  },
  { name: 'Blurbpoint Media',            industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Blurbpoint Media, 6th floor, A-602, 132 Feet Ring Rd, opp. Keshavbaug Party Plot, Suryapooja Block B, Vastrapur, Ahmedabad, Gujarat 380015',                               phone: '9978632425'  },
  { name: 'Qmin Infotech',               industry: 'Digital Marketing', city: 'Ahmedabad',  address: '1101, Shilp Zaveri, Shyamal Cross Rd, nr. Swinagar Socity, Nehru Nagar, Shyamal, Ahmedabad, Gujarat 380015',                                                               phone: '8866588329'  },
  { name: 'Viha Digital Commerce',       industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Sakar IX, 801B-802, Ashram Rd, near Old RBI CBD, Muslim Society, Navrangpura, Ahmedabad, Gujarat 380009',                                                                   phone: '7096620202'  },
  { name: 'Ideamagix',                   industry: 'Digital Marketing', city: 'Ahmedabad',  address: 'Rd number 11, Ambika Nagar No 3, Wagle Industrial Estate, Thane West, Thane, Maharashtra 400604',                                                                           phone: '7021240004'  },

  // ── Telecalling – Ahmedabad ───────────────────────────────────────────────
  { name: 'Go4customer',                 industry: 'Telecalling',       city: 'Ahmedabad',  address: 'Broadway Business Center, Netaji Rd, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                                               phone: '9898578297'  },
  { name: 'Cyfuture India',              industry: 'Telecalling',       city: 'Ahmedabad',  address: 'Broadway Business Centre, Netaji Rd, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                                               phone: '8041306341'  },
  { name: 'Xceltec Interactive',         industry: 'Telecalling',       city: 'Ahmedabad',  address: '301, Sheth Corporate Tower, Purshottam Mavlankar Marg, nr. Nagri Hospital, Ellisbridge, Ahmedabad, Gujarat 380006',                                                         phone: '9879691209'  },
  { name: 'Jyoti Info Solution',         industry: 'Telecalling',       city: 'Ahmedabad',  address: 'Shoppers Plaza-2, Chimanlal Girdharlal Rd, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380006',                                                                             phone: '7575050230'  },
  { name: 'Mavrix',                      industry: 'Telecalling',       city: 'Ahmedabad',  address: 'B/H, Town Hall, Azure House, opp. Hasubhai Chamber, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                                phone: '7971111117'  },
  { name: 'Arise Solution',              industry: 'Telecalling',       city: 'Ahmedabad',  address: 'A-502, Venus Stratum, @ Venus Grounds, Nehru Nagar Cir, Satellite, Ahmedabad, Gujarat 380015',                                                                              phone: '9099922307'  },
  { name: 'Gem Binding',                 industry: 'Telecalling',       city: 'Ahmedabad',  address: '201-202, Shreeji House, Opp. Gujarat Bhavan, Behind MJ Library, Ashram Rd, Ahmedabad, Gujarat 380006',                                                                      phone: '9276083333'  },
  { name: 'Tender Infotech',             industry: 'Telecalling',       city: 'Ahmedabad',  address: 'Aalin Apartment, 202, opp. GUJARAT VIDYAPITH, Income Tax, Ahmedabad, Gujarat 380014',                                                                                       phone: '7874030798'  },
  { name: 'Inextrix Technologies',       industry: 'Telecalling',       city: 'Ahmedabad',  address: '508-509, Lilamani Corporate Heights, Opp. Vadaj, BRTS Stop, Ashram Rd, Bhimjipura, Nava Vadaj, Ahmedabad, Gujarat 380013',                                                 phone: '9316618150'  },
  { name: 'ACPC',                        industry: 'Telecalling',       city: 'Ahmedabad',  address: 'Admission Building, nr. Library L. D. College of Engg. Campus, Navrangpura, Ahmedabad, Gujarat 380015',                                                                     phone: '7926566000'  },
  { name: 'Imagine BPO',                 industry: 'Telecalling',       city: 'Ahmedabad',  address: 'Titanium Heights, Makarba, Ahmedabad, Gujarat 380015',                                                                                                                       phone: '9979203822'  },
  { name: 'Elision Technologies',        industry: 'Telecalling',       city: 'Ahmedabad',  address: '626, East Wing, Stratum @ Venus Grounds, Jhansi Ki Rani, Nehru Nagar, Ahmedabad, Gujarat 380015',                                                                           phone: '7041649394'  },
  { name: 'iPath Infotech',              industry: 'Telecalling',       city: 'Ahmedabad',  address: '601, A, Shridhar Athens, opp. Jhansi ki Rani BRTS Bus Stop, nr. Shivranjani Cross Road, Satellite, Ahmedabad, Gujarat 380015',                                              phone: '9724160089'  },
  { name: 'iCallify',                    industry: 'Telecalling',       city: 'Ahmedabad',  address: '507, Lilamani Corporate Heights, Chandramauli Society, Bhimjipura, Nava Vadaj, Ahmedabad, Gujarat 380013',                                                                  phone: '8488850670'  },
  { name: 'KAP Call Center',             industry: 'Telecalling',       city: 'Ahmedabad',  address: '1st Floor, S.V Arcade, No.25, South, E End Main Rd, Jayanagara 9th Block, East, Bengaluru, Karnataka 560041',                                                               phone: '9738010001'  },
  { name: 'Wesage BPM',                  industry: 'Telecalling',       city: 'Ahmedabad',  address: 'Wall Street 2, B 108, opp. Orient Club, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                                            phone: '8460001175'  },
  { name: 'Unipath Solution',            industry: 'Telecalling',       city: 'Ahmedabad',  address: '505, Mauryansh Elanza Nr. Parekh Hospital, Shyamal Cross Rd, Satellite, Ahmedabad, Gujarat 380015',                                                                         phone: '9724160089'  },

  // ── Telecalling – Gandhinagar ─────────────────────────────────────────────
  { name: 'Etech Global (Gandhinagar)',  industry: 'Telecalling',       city: 'Gandhinagar', address: '1st Floor, IT Tower 4, Infocity, Near Indroda Cir, Infocity, Gandhinagar, Gujarat 382007',                                                                                 phone: '7923213089'  },
  { name: 'Tech Mahindra (Gandhinagar)', industry: 'Telecalling',       city: 'Gandhinagar', address: '4, Floor 4, Tech Mahindra, It Tower, Gandhinagar, Gujarat 382007',                                                                                                         phone: null          },
  { name: 'Computyne',                   industry: 'Telecalling',       city: 'Gandhinagar', address: '3/2, Alpha Arcade, Gandhinagar, Gujarat 382007',                                                                                                                            phone: '8511859883'  },
  { name: 'Siban Experience Center',     industry: 'Telecalling',       city: 'Gandhinagar', address: 'SIBAN Experience Center, Shram Marg, beside Indian Oil Petrol Pump, Gujarat International Finance Tec-City, Gandhinagar, Gujarat 382355',                                   phone: '9974462727'  },
  { name: 'Arogya Samiksha Kendra',      industry: 'Telecalling',       city: 'Gandhinagar', address: '6M82+9G7, Sector 10A, Sector 10, Gandhinagar, Gujarat 382010',                                                                                                             phone: null          },
  { name: 'Prescott Infosys',            industry: 'Telecalling',       city: 'Gandhinagar', address: '3rd Floor, Siddhraj Zavod, 310, nr. Sargasan Cross Road, Sargasan, Gandhinagar, Gujarat 382006',                                                                           phone: '9426005101'  },

  // ── Telecalling – Vadodara ────────────────────────────────────────────────
  { name: 'Cogent eServices',            industry: 'Telecalling',       city: 'Vadodara',   address: 'National Hwy 8 Dumad Service Rd, opp. Satyam Hospitals, Chhani, Vadodara, Gujarat 391740',                                                                                  phone: '1204832550'  },
  { name: 'Etech Global (Vadodara)',     industry: 'Telecalling',       city: 'Vadodara',   address: 'GEB Office, Block 3 Keval Corporate Park Building Chhani Road Opp, Vadodara, Gujarat 390024',                                                                               phone: '2652771943'  },
  { name: 'Teleperformance',             industry: 'Telecalling',       city: 'Vadodara',   address: '2nd Floor, 1965, Alembic City Avenue Alembic Premises, Alembic Rd, near Alembic House, Gorwa, Vadodara, Gujarat 390003',                                                    phone: null          },
  { name: 'Maxius',                      industry: 'Telecalling',       city: 'Vadodara',   address: 'Kirti Plaza Nr. Pramukh Prasad Cross Roads, Manjalpur, Vadodara, Gujarat 390011',                                                                                           phone: '9877098771'  },
  { name: 'Concentrix Imperia',          industry: 'Telecalling',       city: 'Vadodara',   address: '1st & 2nd Floor, Imperia Building, Old Chhani Rd, nr. D-Mart, Sardar Nagar, Nizampura, Vadodara, Gujarat 390002',                                                           phone: null          },
  { name: 'Tronicles System Services',   industry: 'Telecalling',       city: 'Vadodara',   address: '6th Floor, Everest Onyx 603, Race Course Rd, opp. Inox Cinema, Race Course, Vadiwadi, Vadodara, Gujarat 390021',                                                            phone: '9586841111'  },
  { name: 'Sticker Mule India',          industry: 'Telecalling',       city: 'Vadodara',   address: '43/A, Makarpura GIDC, Makarpura, Vadodara, Gujarat 390010',                                                                                                                 phone: '7861813040'  },
  { name: 'Concentrix',                  industry: 'Telecalling',       city: 'Vadodara',   address: 'F-A-37, Gorwa Rd, BIDC Gorwa Estate, Gorwa, Vadodara, Gujarat 390003',                                                                                                      phone: null          },
  { name: 'Patterns',                    industry: 'Telecalling',       city: 'Vadodara',   address: 'B/H Zummerwala TVS Showroom, 47 Gujarat Industrial Estate, Old Chhani Rd, nr. Surendra Nursery, Vadodara, Gujarat 390024',                                                  phone: '2652773920'  },
  { name: 'Vivazperk Business Services', industry: 'Telecalling',       city: 'Vadodara',   address: 'Shree Nidhi Gallery, B-3, Vasna Rd, Tagore Nagar, Diwalipura, Vadodara, Gujarat 390007',                                                                                   phone: '2653550730'  },
  { name: 'Sata Communications',         industry: 'Telecalling',       city: 'Vadodara',   address: 'Arundeep Complex, 407-408, Haribhakti Colony, Paris Nagar, Diwalipura, Vadodara, Gujarat 390007',                                                                           phone: '6353187341'  },
  { name: 'RNS Globe Serve',             industry: 'Telecalling',       city: 'Vadodara',   address: 'Third Floor Besides, Darshanam Central Park, Darshanam Trade Center III, 18 to 21, nr. Surya Palace Hotel, Sayajiganj, Vadodara, Gujarat 390020',                           phone: null          },
  { name: 'Byteforce IT',                industry: 'Telecalling',       city: 'Vadodara',   address: 'SF-43, Ved Trans Cube Plaza, Central Bus Terminal, Sayajiganj, Vadodara, Gujarat 390005',                                                                                   phone: '7004264863'  },
  { name: 'Siddhi Account',              industry: 'Telecalling',       city: 'Vadodara',   address: '601, Imperial Heights, Akshar Chowk, Parvati Nagar, Tandalja, Vadodara, Gujarat 390012',                                                                                    phone: null          },

  // ── Telecalling – Surat ──────────────────────────────────────────────────
  { name: 'Votiko Solutions',            industry: 'Telecalling',       city: 'Surat',      address: 'Mailstone Indigo, 502, Ring Rd, near Udhana Darwaja, Aman Nagar, Surat, Gujarat 395002',                                                                                    phone: '9722282367'  },
  { name: 'Synergy Info Outsourcing',    industry: 'Telecalling',       city: 'Surat',      address: '306-Time Square, Gaurav Path Road, opp. Apex Hospital, Pal Gam, Surat, Gujarat 394510',                                                                                     phone: '8460304448'  },
  { name: 'Transform Solution',          industry: 'Telecalling',       city: 'Surat',      address: 'The Junomoneta Tower, 1605-07, opposite RTO, PAL, Adajan Gam, Adajan, Surat, Gujarat 394510',                                                                               phone: '7802973555'  },
  { name: 'Cincos Placement Services',   industry: 'Telecalling',       city: 'Surat',      address: 'OFFICE NO - M 7/M 8 2ND FLOOR, RAJ CORNER NEAR, L.P.Savani School Near Sai-heights, Adajan, Surat, Gujarat 394510',                                                        phone: '7226004473'  },
  { name: 'Happy2helpp',                 industry: 'Telecalling',       city: 'Surat',      address: 'Bus Depot, 230, near Adajan, Hubtown, Adajan Patiya, Surat, Gujarat 395009',                                                                                                phone: '8401609998'  },
  { name: 'Kiotel Hospitality Center',   industry: 'Telecalling',       city: 'Surat',      address: '3rd Floor, 9292, VIP Rd, near Metro Wholesale, near Shree Shyam Baba Mandir, Althan, Surat, Gujarat 395007',                                                                phone: null          },
  { name: 'Hashtag Infosystem',          industry: 'Telecalling',       city: 'Surat',      address: 'Royal Blue Residency, Bhaya St, Nanpura, Surat, Gujarat 395001',                                                                                                            phone: '7990510536'  },

  // ── Tech Mahindra – Ahmedabad (duplicate entry from original data) ─────────
  { name: 'Tech Mahindra (Ahmedabad)',   industry: 'Telecalling',       city: 'Ahmedabad',  address: 'Venus Stratum, 15th Floor, West Wing for BPS and East Wing for IT, Surendra Mangaldas Rd, Niyojan Nagar, Ambawadi, Ahmedabad, Gujarat 380015',                              phone: null          },

  // ── Digital Marketing – Ahmedabad (Batch 2) ───────────────────────────────
  { name: 'Digikliq',                          industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Ravija Plaza, 228, beside times square, Thaltej, Ahmedabad, Gujarat 380054',                                                                                              phone: '9664841852'  },
  { name: 'Sunlight Digital',                  industry: 'Digital Marketing', city: 'Ahmedabad', address: 'G I D C Industrial Area, Odhav, Ahmedabad, Gujarat 382415',                                                                                                               phone: '9054062558'  },
  { name: 'ShoutnHike',                        industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Office No. 801, 3, Rajnagar Club Lane, opp. Core Biotech, nr. Municipal School, Tulsibag Society, Ambawadi, Ahmedabad, Gujarat 380006',                                   phone: '9974360053'  },
  { name: 'AG Digital Marketing',              industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Office No-507, Elight Magnum, Sola Rd, opposite Utsav Elegance, Bhuyangdev Society, C.P. Nagar-1, Ahmedabad, Gujarat 380061',                                             phone: '8511881433'  },
  { name: 'Mark Honest Digital Solution',      industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Avani Icon, 208, cross Road, near Hari Darshan, opp. Shalby Hospital, Vasant Vihar 2, Nava Naroda, Ahmedabad, Gujarat 382330',                                            phone: '8866512292'  },
  { name: 'DM Tech Studio',                    industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Sun Gravitas, 1139-1140, Rajmani Society, Shyamal, Ahmedabad, Gujarat 380015',                                                                                             phone: '9265438987'  },
  { name: 'Digital Sky 360',                   industry: 'Digital Marketing', city: 'Ahmedabad', address: '802 Abhishree Adroit, Mansi Cross Road, Judges Bunglow Rd, nr. Vastrapur, Ahmedabad, Gujarat 380015',                                                                      phone: '9909013563'  },
  { name: 'Kleverish',                         industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Shivalik Shilp 2, 521, Judges Bunglow Rd, nr. Mansi Cross Road, opp. ITC Narmada Hotel, Suryapooja Block B, Vastrapur, Ahmedabad, Gujarat 380015',                        phone: '9328413256'  },
  { name: 'Thanksweb Marketing',               industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Ganesh Glory 11, E-706, Jagatpur Rd, off Sarkhej - Gandhinagar Highway, near BSNL Zonal Office, Gota, Ahmedabad, Gujarat 382470',                                         phone: '8141990085'  },
  { name: 'Triovate Pvt Ltd',                  industry: 'Digital Marketing', city: 'Ahmedabad', address: '10th Floor 1018, Fortune Business Hub, Science City Rd, Sola, Ahmedabad, Gujarat 380060',                                                                                  phone: '9408968634'  },
  { name: 'Vinayak Infosoft',                  industry: 'Digital Marketing', city: 'Ahmedabad', address: '331, New Cloth Market, O/s Raipur Gate, Sarangpur, Ahmedabad, Gujarat 380002',                                                                                             phone: '9426360578'  },
  { name: 'ARE Infotech',                      industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Surmount Complex, 306, Sarkhej - Gandhinagar Hwy, opposite Iscon Mega Mall, near Baleshwar Square, Satellite, Ahmedabad, Gujarat 380054',                                  phone: '9974991413'  },
  { name: 'Digital Pundit',                    industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Shivalik Square, 709, 132 Feet Ring Rd, near Adani Gas Pump, Ramapir Thekra, Old Wadaj, Ahmedabad, Gujarat 380013',                                                        phone: '9173749033'  },
  { name: 'UV Digital Solution',               industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Hilltown Landmark, 622, Nikol - Naroda Rd, opp. DAS KHAMAN, Nicol Gam, Nikol, Ahmedabad, Gujarat 382350',                                                                  phone: '9023079063'  },
  { name: 'SmartFish Design',                  industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Mansi Cross Road, 806, Abhishree Adroit, Judges Bunglow Rd, nr. Vastrapur, Ahmedabad, Gujarat 380015',                                                                     phone: '7490021947'  },
  { name: 'Albatroz Digital',                  industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Arjun Tower, 23-F.F, B/H, Bhuyangdev Rd, nr. Saundarya Flat, CP Nagar 2, Ghatlodiya, Ahmedabad, Gujarat 380061',                                                          phone: '9327436707'  },
  { name: 'Growup Business Solution',          industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Girivar Glean Mall, 617, Sardar Patel Ring Rd, Odhav, Ahmedabad, Gujarat 382415',                                                                                          phone: '7414063433'  },
  { name: 'Alphesh Vaghela',                   industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Sahaj Residency, E-503, opp. Pandav vadi, Nikol, Ahmedabad, Gujarat 380049',                                                                                               phone: '9725697456'  },
  { name: 'Linkgenic Digitech',                industry: 'Digital Marketing', city: 'Ahmedabad', address: '1002, Titanium City Center, C-1001, Prahlad Nagar, Ahmedabad, Gujarat 380015',                                                                                             phone: '9149480784'  },
  { name: 'ETA Marketing Solution',            industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Sivanta One, B-613-614, opp. Bank Of Baroda, Pritam Nagar, Paldi, Ahmedabad, Gujarat 380006',                                                                              phone: '7383891097'  },
  { name: 'Stock Media',                       industry: 'Digital Marketing', city: 'Ahmedabad', address: '502, Phoenix, nr. Honest restaurant, N.K.Group Society, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009',                                                   phone: '7043841319'  },
  { name: 'Flora Fountain',                    industry: 'Digital Marketing', city: 'Ahmedabad', address: '1302, 13th Floor, Shivalik Shilp Iskcon Cross Road, Sarkhej - Gandhinagar Hwy, Ahmedabad, Gujarat 380058',                                                                 phone: '9558079502'  },
  { name: 'ASDM',                              industry: 'Digital Marketing', city: 'Ahmedabad', address: '217, Shangrila Arcade, near Shyamal Cross Rd, above First Cry, Shyamal, Ahmedabad, Gujarat 380015',                                                                        phone: '9016970734'  },
  { name: 'City Business Group',               industry: 'Digital Marketing', city: 'Ahmedabad', address: '5th Floor, Sanidhya Complex, 41, Ashram Rd, opp. Sanyash, Ellisbridge, Ahmedabad, Gujarat 380009',                                                                         phone: '8000262626'  },
  { name: 'Gandhi Media Solutions',            industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Office No-507, Elite Magnum, beside Solaris Business Hub, Vardhmannagar Society, C.P. Nagar-1, Naranpura, Ahmedabad, Gujarat 380013',                                      phone: '9099229964'  },
  { name: 'Dizinfinity',                       industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Shilp Zaveri, 706, Shyamal Cross Rd, Swinagar Society, Nehru Nagar, Shyamal, Ahmedabad, Gujarat 380015',                                                                   phone: '6356699123'  },
  { name: 'Gyani Media',                       industry: 'Digital Marketing', city: 'Ahmedabad', address: '620, nr. Shyamal Cross Road, Rajmani Society, Shyamal, Ahmedabad, Gujarat 380015',                                                                                          phone: '9714144044'  },
  { name: 'Kaushalam Technology',              industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Wall Street 1, 409, opposite Oriental Club Jungle Bhookh Restaurant, near Gujarat College Road, Ellisbridge, Ahmedabad, Gujarat 380006',                                    phone: '9714466888'  },
  { name: 'Litmus Branding',                   industry: 'Digital Marketing', city: 'Ahmedabad', address: '10th Floor, Panch Dhara Complex, 1002/1, Sarkhej - Gandhinagar Hwy, nr. The Grand Bhagwati, Bodakdev, Ahmedabad, Gujarat 380054',                                          phone: '9998412378'  },
  { name: 'Studio 45 India',                   industry: 'Digital Marketing', city: 'Ahmedabad', address: '1st Floor, Abhijeet - II, Umashankar Joshi Marg, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380006',                                                                      phone: '7940322115'  },
  { name: 'Zero Gravity Communication',        industry: 'Digital Marketing', city: 'Ahmedabad', address: 'Applewoods Township, Swati Trinity, C403 to C411, Sardar Patel Ring Rd, near Shantipura, Sarkhej-Okaf, Ahmedabad, Gujarat 380054',                                         phone: '7969164949'  },

  // ── Telecalling – Ahmedabad (Batch 2) ────────────────────────────────────
  { name: 'Mas Callnet',                       industry: 'Telecalling',       city: 'Ahmedabad', address: 'Jaldarshaan Co-operative Housing Society, Commercial Building, F-15, Ashram Rd, opp. Natraj Cinema, nr. Bank of Baroda, Vishalpur, Ellisbridge, Ahmedabad, Gujarat 380009', phone: '7290093873'  },
  { name: 'Adani Customer Helpdesk',           industry: 'Telecalling',       city: 'Ahmedabad', address: '03, Sumangalam Society, Opp Asia School, Drive In Rd, Sunrise Park, Gurukul, Ahmedabad, Gujarat 380054',                                                                    phone: '7927623264'  },
  { name: 'Technomine',                        industry: 'Telecalling',       city: 'Ahmedabad', address: '4th Floor, 401-403, Shoppers Plaza, 4, Chimanlal Girdharlal Rd, above Ritu Kumar Showroom, opp. BSNL Bhavan, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380006',          phone: '7940075474'  },
  { name: 'Hitech Digital Solution',           industry: 'Telecalling',       city: 'Ahmedabad', address: '9th Floor, Prahladnagar, 100 Feet Anand Nagar Rd, Ahmedabad, Gujarat 380015',                                                                                              phone: '7940003000'  },
  { name: 'Riddhi Corporate Service',          industry: 'Telecalling',       city: 'Ahmedabad', address: '10, Mill Officers Colony, B/h Old RBI, Opp-Times Of India, Ashram Rd, Ahmedabad, Gujarat 380009',                                                                          phone: '7804040404'  },

  // ── Software – Ahmedabad (Batch 2) ───────────────────────────────────────
  { name: 'Sapphire Software Solution',        industry: 'Software',          city: 'Ahmedabad', address: 'Ganesh Meridian, C-102/103, Sarkhej - Gandhinagar Hwy, opp. Kargil Petrol Pump, Ahmedabad, Gujarat 380060',                                                                phone: '9099976034'  },
  { name: 'Techcronus Business Solution',      industry: 'Software',          city: 'Ahmedabad', address: 'B-821, Stratum @ Venus Grounds, Jhansi Ki Rani, Surendra Mangaldas Road, Satellite Rd, Nehru Nagar, Ahmedabad, Gujarat 380015',                                            phone: null          },
  { name: 'Global Software',                   industry: 'Software',          city: 'Ahmedabad', address: 'SUN WESTBANK, B 905-908, Ashram Rd, near VALLABH SADAN, opp. CITY GOLD, Vishalpur, Muslim Society, Navrangpura, Ahmedabad, Gujarat 380009',                                phone: '7966617000'  },
  { name: 'Bacancy Technology',                industry: 'Software',          city: 'Ahmedabad', address: 'Times Corporate Park, 15-16, Thaltej, Ahmedabad, Gujarat 380059',                                                                                                           phone: null          },
  { name: 'Vrinsoft Technology',               industry: 'Software',          city: 'Ahmedabad', address: 'AUDI Showroom Lane, Shapath Hexa, 707, Elite Business Park, Sarkhej - Gandhinagar Hwy, Ahmedabad, Gujarat 380060',                                                         phone: '7227906117'  },
  { name: 'Infolabz',                          industry: 'Software',          city: 'Ahmedabad', address: '405, Vraj Avenue, above SAM\'S Pizza, nr. Commerce Six Road, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009',                                                     phone: '8866662662'  },
  { name: 'Add Pearl Info',                    industry: 'Software',          city: 'Ahmedabad', address: 'Law Garden, 602, Samartheshwar Mahadev Rd, opp. Axis Bank B/h, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                    phone: '8905510009'  },
  { name: 'IT Path Solution',                  industry: 'Software',          city: 'Ahmedabad', address: 'BRTS Road, 801, 8th Floor, Binori B Square, 1, Ambli Rd, Ahmedabad, Gujarat 380058',                                                                                        phone: '2717461154'  },
  { name: 'Techmicra IT Solution',             industry: 'Software',          city: 'Ahmedabad', address: '408, 4th Floor, Ashwamegh Elegance III, Nr. CN Vidhyalay, opp. SBI Zonal Office, Ambawadi, Ahmedabad, Gujarat 380015',                                                     phone: '7043786365'  },
  { name: 'Biztech Consulting and Solution',   industry: 'Software',          city: 'Ahmedabad', address: 'C/801 Dev Aurum Commercial, Anandnagar Cross Road, Prahalad Nagar, Satellite, Ahmedabad, Gujarat 380015',                                                                   phone: '9106747559'  },
  { name: 'Infikey Technologies',              industry: 'Software',          city: 'Ahmedabad', address: 'KRISH CUBICAL, BLOCK-B/901, nr. Govardhan Party Plot, Ahmedabad, Gujarat 380059',                                                                                           phone: '6351584506'  },
  { name: 'Nichetech Computer Solution',       industry: 'Software',          city: 'Ahmedabad', address: '409, Shital Varsha Complex, Cross Road, Shivranjani, Suryapooja Block B, Satellite, Ahmedabad, Gujarat 380015',                                                            phone: '9512180005'  },
  { name: 'LTTRBX Technologies',               industry: 'Software',          city: 'Ahmedabad', address: 'E-1214, GANESH GLORY 11, Jagatpur Rd, off Sarkhej - Gandhinagar Highway, near BSNL Office, Jagatpur, Ahmedabad, Gujarat 382470',                                           phone: '9574495066'  },
  { name: 'Solguruz',                          industry: 'Software',          city: 'Ahmedabad', address: '10, Sundarvan Society, Ashram Rd, near AUDA Office, Usmanpura, Ahmedabad, Gujarat 380014',                                                                                  phone: '7802028994'  },
  { name: 'Z Tech Solution',                   industry: 'Software',          city: 'Ahmedabad', address: 'Ground Floor 1&2, Shalimar Complex, New Mahalaxmi Cross Rd, Paldi, Ahmedabad, Gujarat 380007',                                                                              phone: '7041785017'  },
  { name: 'SPEC India',                        industry: 'Software',          city: 'Ahmedabad', address: 'SPEC House, Parth Complex, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009',                                                                                        phone: '7926404031'  },
  { name: 'IndiaNIC Infotech',                 industry: 'Software',          city: 'Ahmedabad', address: '201, Iscon, Sarkhej - Gandhinagar Hwy, near Iskcon Bridge, Ramdev Nagar, Ahmedabad, Gujarat 380015',                                                                       phone: '7961916000'  },
  { name: 'Tatvasoft',                         industry: 'Software',          city: 'Ahmedabad', address: 'TatvaSoft House, Near Shivalik Business Center, Sarkhej - Gandhinagar Highway, Rajpath Rangoli Rd, Ahmedabad, Gujarat 380059',                                             phone: '9601421472'  },
  { name: 'Binary Republik',                   industry: 'Software',          city: 'Ahmedabad', address: '202 Gala Mart, Nr Gala Swing, South Bopal, Ahmedabad, Gujarat 380057',                                                                                                      phone: '6789608003'  },
  { name: 'Itechnotion',                       industry: 'Software',          city: 'Ahmedabad', address: 'KP Epitome, A504-506, near Dav International School, Makarba, Ahmedabad, Gujarat 380051',                                                                                   phone: '7948948998'  },
  { name: 'Iflair Web Technologies',           industry: 'Software',          city: 'Ahmedabad', address: '3rd Floor, Karma Complex, Chimanlal Girdharlal Rd, Paldi, Ahmedabad, Gujarat 380007',                                                                                       phone: '9558803176'  },
  { name: 'Infilon Technologies',              industry: 'Software',          city: 'Ahmedabad', address: 'Shivalik Shilp 2, 1101-1105, Judges Bunglow Rd, opp. Keshavbaug Party Plot, Suryapooja Block B, Satellite, Ahmedabad, Gujarat 380015',                                     phone: '8160763895'  },
  { name: 'Visitor Cloud Technologies',        industry: 'Software',          city: 'Ahmedabad', address: 'Avdhesh House 303, opp. Gurudwara, Bodakdev, Ahmedabad, Gujarat 380054',                                                                                                    phone: '8488964723'  },
  { name: 'CYNIX',                             industry: 'Software',          city: 'Ahmedabad', address: '5, Ganga Yamuna Complex, Chimanlal Girdharlal Road, near Festo, opposite Sun Square, Navrangpura, Ahmedabad, Gujarat 380009',                                               phone: '9081557722'  },
  { name: 'Aspire Softserv',                   industry: 'Software',          city: 'Ahmedabad', address: '402, Vishwa Complex, Bus Stand, near Navrangpura, opposite Jain Temple, Shrimali Society, Navrangpura, Ahmedabad, Gujarat 380009',                                          phone: '7946025309'  },
  { name: 'Innonix Tech Solution',             industry: 'Software',          city: 'Ahmedabad', address: '1105-1108, iSquare Corporate Park, Near CIMS Hospital, Shukan Mall Cross Road, Science City Rd, Sola, Ahmedabad, Gujarat 380060',                                          phone: '7096499910'  },
  { name: 'iCreative Technologies',            industry: 'Software',          city: 'Ahmedabad', address: 'Binori BSquare3, 1001-1008, Sindhubhavan Rd, Bodakdev, Ahmedabad, Gujarat 380059',                                                                                          phone: '9825877071'  },
  { name: 'Citrusbug Technolabs',              industry: 'Software',          city: 'Ahmedabad', address: 'A 411 Shivalik Corporate Park, Above D Mart, Nr. Shyamal Cross Road, Satellite, Ahmedabad, Gujarat 380015',                                                                phone: '8128442240'  },
  { name: 'Technostacks',                      industry: 'Software',          city: 'Ahmedabad', address: '10th Floor, Sun Square, Chimanlal Girdharlal Rd, beside Hotel Regenta, Navrangpura, Ahmedabad, Gujarat 380006',                                                             phone: '9909712616'  },
  { name: 'Alakmalak Technologies',            industry: 'Software',          city: 'Ahmedabad', address: '402, Corporate House, Ashram Rd, nr. Dinesh Hall, nr. Income Tax, Shreyas Colony, Navrangpura, Ahmedabad, Gujarat 380009',                                                  phone: '7940069595'  },
  { name: 'Web And Mobile Development Company', industry: 'Software',         city: 'Ahmedabad', address: 'The First, B/H, Keshav Baugh Party Plot, D-307, near Shivalik Highstreet, Ahmedabad, Gujarat 380015',                                                                      phone: '8200945089'  },
  { name: 'Infotronicx',                       industry: 'Software',          city: 'Ahmedabad', address: '714, Shivalik Shilp 2, Judges Bunglow Rd, opp. ITC Narmada Hotel, nr. Shivranjani Cross Road, Suryapooja Block B, Satellite, Ahmedabad, Gujarat 380015',                  phone: '9909943151'  },
  { name: 'Innovatics',                        industry: 'Software',          city: 'Ahmedabad', address: 'KP Epitome, A 509-513, nr. Dav International School, Makarba, Ahmedabad, Gujarat 380051',                                                                                   phone: '9023096641'  },
  { name: 'Staunchsys IT Services',            industry: 'Software',          city: 'Ahmedabad', address: '410-413, Aaron Spectra, Behind Rajpath Club, Rajpath Rangoli Road, Sarkhej - Gandhinagar Hwy, Bodakdev, Ahmedabad, Gujarat 380059',                                        phone: '7946043901'  },
  { name: 'Raindrops Infotech',                industry: 'Software',          city: 'Ahmedabad', address: 'Shivanta One, A/804, opp. Nalli Silk Sarees, next to Hare Krishna Complex, Pritam Nagar, Paldi, Ahmedabad, Gujarat 380006',                                                phone: '9099032177'  },
  { name: 'Retner',                            industry: 'Software',          city: 'Ahmedabad', address: 'Sun Westbank, A-1133, Ashram Rd, Vishalpur, Muslim Society, Navrangpura, Ahmedabad, Gujarat 380009',                                                                        phone: '9909922845'  },
  { name: 'Hupp Technologies',                 industry: 'Software',          city: 'Ahmedabad', address: 'Hotel BVR EK, 1201-D, near Hotel Westend, opp. Inder Residency, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                   phone: '7874515717'  },
  { name: 'Innoventaa Technologies',           industry: 'Software',          city: 'Ahmedabad', address: '405, Sigma Legacy, IIM Road, Ambawadi, nr. Panjrapole Cross Road, Ahmedabad, Gujarat 380015',                                                                               phone: '9428503923'  },
  { name: 'XLTEC Interactive',                 industry: 'Software',          city: 'Ahmedabad', address: '301, Sheth Corporate Tower, Purshottam Mavlankar Marg, nr. Nagri Hospital, Ellisbridge, Ahmedabad, Gujarat 380006',                                                        phone: '9879691209'  },
  { name: 'AIS Technolabs',                    industry: 'Software',          city: 'Ahmedabad', address: 'B 707 A, Mondeal Square, Sarkhej - Gandhinagar Hwy, Prahlad Nagar, Ahmedabad, Gujarat 380015',                                                                             phone: '7575006403'  },
  { name: 'DNG Web Developer',                 industry: 'Software',          city: 'Ahmedabad', address: '1104, 11th Floor, Capstone Building, opp. Chirag Motors, nr. Parimal Garden, Ellisbridge, Ahmedabad, Gujarat 380006',                                                      phone: '9824890699'  },
  { name: 'Nextsavy',                          industry: 'Software',          city: 'Ahmedabad', address: '507, Phoenix, Near Vijay Cross Rd, N.K.Group Society, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009',                                                     phone: '5127824466'  },
  { name: 'Aglowid IT Solution',               industry: 'Software',          city: 'Ahmedabad', address: '501, City Center, Opp Shukan Mall, Science City Rd, Ahmedabad, Gujarat 380060',                                                                                             phone: '9016227777'  },
  { name: 'Orical Technologies',               industry: 'Software',          city: 'Ahmedabad', address: '4th Floor, Silicon Tower, 405, Chimanlal Girdharlal Rd, Ellisbridge, Ahmedabad, Gujarat 380009',                                                                            phone: '7041597976'  },
  { name: 'Krishaweb',                         industry: 'Software',          city: 'Ahmedabad', address: '510, Sakar 2, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                                                                      phone: '7874109182'  },
  { name: 'Rlogical Technosoft',               industry: 'Software',          city: 'Ahmedabad', address: '701, Chimanlal Girdharlal Rd, opp. Tanishq Showroom, behind Lal Bunglow, New Commercial Mills Staff Society, Ellisbridge, Ahmedabad, Gujarat 380006',                      phone: '7966621707'  },
  { name: 'Shivtechnolabs',                    industry: 'Software',          city: 'Ahmedabad', address: '7th Floor, PV Enclave, opp. Courtyard by Marriott, off Sindhubhavan Road, Bodakdev, Ahmedabad, Gujarat 380059',                                                            phone: '7940077787'  },
  { name: 'Kretoss Technology',                industry: 'Software',          city: 'Ahmedabad', address: 'Shilp Corporate Park, B-1007, Rajpath Rangoli Rd, near Rajpath Club, Bodakdev, Ahmedabad, Gujarat 380059',                                                                  phone: '8155709603'  },
  { name: 'Digibid Solution',                  industry: 'Software',          city: 'Ahmedabad', address: '204, Samruddhi Complex, Dharnidhar Cross Rd, opp. Sakar-3, nr. Income Tax, Sattar Taluka Society, Navrangpura, Ahmedabad, Gujarat 380009',                                 phone: '8511126355'  },
  { name: 'Aark Infosoft',                     industry: 'Software',          city: 'Ahmedabad', address: '5th Floor, Maradia Plaza, A Wing, Chimanlal Girdharlal Rd, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                        phone: '18008901431' },
  { name: 'iMobdev Technologies',              industry: 'Software',          city: 'Ahmedabad', address: 'Shivam Complex, 201, Science City Rd, opp. Hetarth Party Plot, Sola, Ahmedabad, Gujarat 380060',                                                                            phone: '7405122300'  },
  { name: 'Synoptek India',                    industry: 'Software',          city: 'Ahmedabad', address: 'B Block, 1st Floor, Mondeal Heights, Novotel Hotel, Sarkhej - Gandhinagar Hwy, Besides, Ahmedabad, Gujarat 380015',                                                        phone: '7966824700'  },
  { name: 'Budventure Technologies',           industry: 'Software',          city: 'Ahmedabad', address: '303, Vedanta, opp. Usmanpura Garden, Usmanpura, Ahmedabad, Gujarat 380009',                                                                                                 phone: null          },
  { name: 'Gujarat Infotech',                  industry: 'Software',          city: 'Ahmedabad', address: '3rd Floor, 304-307, Science City Rd, near Shell Petrol Pump, Sola, Ahmedabad, Gujarat 380060',                                                                             phone: '7927485109'  },
  { name: 'The One Technologies',              industry: 'Software',          city: 'Ahmedabad', address: 'Abhishree Avenue, 303, near Nehru Nagar Circle, Patel Colony, Ambawadi, Ahmedabad, Gujarat 380015',                                                                         phone: '6358288840'  },
  { name: 'Waytoweb',                          industry: 'Software',          city: 'Ahmedabad', address: '405, 3rd EYE - 2 Building, Near Joyalukkas, Opp. Parimal Garden, Panchavati Cross Road, Ambawadi, Ahmedabad, Gujarat 380006',                                              phone: '7940041819'  },
  { name: 'Maxgen Technologies',               industry: 'Software',          city: 'Ahmedabad', address: 'Abhijeet 3, 603, Netaji Rd, near Pantaloons, Mithakhali, Ellisbridge, Ahmedabad, Gujarat 380006',                                                                          phone: '9099039845'  },
  { name: 'Shaligram',                         industry: 'Software',          city: 'Ahmedabad', address: '3rd Floor, Shaligram Corporates, C.J Road, Ambli, Ahmedabad, Gujarat 380058',                                                                                               phone: '9909984567'  },
  { name: 'Siddh Software India',              industry: 'Software',          city: 'Ahmedabad', address: '703, Mahakant Complex, Paldi Rd, opposite V.S Hospital, Madalpur Gam, Paldi, Ahmedabad, Gujarat 380006',                                                                   phone: '7878383940'  },
  { name: 'Agile Infowys LLC',                 industry: 'Software',          city: 'Ahmedabad', address: '10th Floor, Ashridhar Athens, Shivranjani Cross Rd, opp. Statue of Jhanshi ki Rani, Ahmedabad, Gujarat 380015',                                                            phone: '7622081234'  },
  { name: 'Prioxies Technologies',             industry: 'Software',          city: 'Ahmedabad', address: 'Titanium Business Park, B 1203-1208, Corporate Rd, Prahlad Nagar, Ahmedabad, Gujarat 380051',                                                                               phone: '9054272806'  },
  { name: 'Concept Infoways',                  industry: 'Software',          city: 'Ahmedabad', address: 'Parshwa Tower, 801 B, Sarkhej - Gandhinagar Hwy, Bodakdev, Ahmedabad, Gujarat 380015',                                                                                      phone: '7926872057'  },
  { name: 'CMARIX',                            industry: 'Software',          city: 'Ahmedabad', address: 'Aaryan Work Spaces, 302-306, Drive In Rd, opp. Manav Mandir Road, Sushil Nagar Society, Memnagar, Ahmedabad, Gujarat 380052',                                               phone: '8000050808'  },
  { name: 'Azilen Technologies',               industry: 'Software',          city: 'Ahmedabad', address: '12th & 13th Floor, B Square 1, Ambli - Bopal Rd, Bopal, Ahmedabad, Gujarat 380058',                                                                                        phone: '2717400928'  },
] as const

// Cycling helpers
const stages:     LeadStage[]    = [LeadStage.NEW, LeadStage.CONTACTED, LeadStage.CHATTING, LeadStage.NEGOTIATION, LeadStage.MEETING_SET, LeadStage.COLD, LeadStage.NOT_INTERESTED]
const priorities: LeadPriority[] = [LeadPriority.HIGH, LeadPriority.MEDIUM, LeadPriority.LOW]
const subStatuses: LeadSubStatus[] = [LeadSubStatus.NO_REQUIREMENT, LeadSubStatus.BUDGET_LOW, LeadSubStatus.PROPOSAL_SENT, LeadSubStatus.WARM_LEAD, LeadSubStatus.BLANK]
const dealValues  = [150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 600000, 750000]

async function main() {
  console.log('🌱 Starting seed...')

  const org = await prisma.organization.upsert({
    where: { slug: 'solobuild' },
    update: {},
    create: { name: 'SoloBuild', slug: 'solobuild' },
  })
  
  await prisma.lead.deleteMany({ where: { organizationId: org.id } })
  await prisma.pipelineStage.deleteMany({ where: { organizationId: org.id } })
  console.log('🗑️ Wiped existing leads and stages for clean seed')
  console.log('✅ Organization:', org.name)

  // ── 2. Upsert Users ────────────────────────────────────────────────────────
  const ceo = await prisma.user.upsert({
    where: { email: 'solobuildceo@gmail.com' },
    update: { 
      name: 'solobuildceo',
      password: await bcrypt.hash('solobuildceo@gmail.com', 10) 
    },
    create: {
      name: 'solobuildceo',
      email: 'solobuildceo@gmail.com',
      password: await bcrypt.hash('solobuildceo@gmail.com', 10),
      initials: 'SC',
      role: Role.ORG_ADMIN,
      organizationId: org.id,
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'solobuildmanager@gmail.com' },
    update: { 
      name: 'solobuildmanager',
      password: await bcrypt.hash('solobuildmanager@gmail.com', 10) 
    },
    create: {
      name: 'solobuildmanager',
      email: 'solobuildmanager@gmail.com',
      password: await bcrypt.hash('solobuildmanager@gmail.com', 10),
      initials: 'SM',
      role: Role.MANAGER,
      organizationId: org.id,
      managerId: ceo.id,
    },
  })

  const worker1 = await prisma.user.upsert({
    where: { email: 'solobuildworker@gmail.com' },
    update: { 
      name: 'solobuildworker',
      password: await bcrypt.hash('solobuildworker@gmail.com', 10) 
    },
    create: {
      name: 'solobuildworker',
      email: 'solobuildworker@gmail.com',
      password: await bcrypt.hash('solobuildworker@gmail.com', 10),
      initials: 'SW',
      role: Role.SALES_REP,
      organizationId: org.id,
      managerId: manager.id,
    },
  })

  const worker2 = await prisma.user.upsert({
    where: { email: 'solobuildworker2@gmail.com' },
    update: { 
      name: 'solobuildworker2',
      password: await bcrypt.hash('solobuildworker2@gmail.com', 10) 
    },
    create: {
      name: 'solobuildworker2',
      email: 'solobuildworker2@gmail.com',
      password: await bcrypt.hash('solobuildworker2@gmail.com', 10),
      initials: 'SW2',
      role: Role.SALES_REP,
      organizationId: org.id,
      managerId: manager.id,
    },
  })
  console.log('✅ Users seeded: CEO, Manager, Worker1, Worker2')

  // ── 3. LeadSources ─────────────────────────────────────────────────────────
  const [refSource, webSource, linkedinSource, metaSource] = await Promise.all([
    prisma.leadSource.upsert({ where: { name_organizationId: { name: 'Direct Referral', organizationId: org.id } }, update: {}, create: { name: 'Direct Referral', organizationId: org.id } }),
    prisma.leadSource.upsert({ where: { name_organizationId: { name: 'Website Lead',    organizationId: org.id } }, update: {}, create: { name: 'Website Lead',    organizationId: org.id } }),
    prisma.leadSource.upsert({ where: { name_organizationId: { name: 'LinkedIn',        organizationId: org.id } }, update: {}, create: { name: 'LinkedIn',        organizationId: org.id } }),
    prisma.leadSource.upsert({ where: { name_organizationId: { name: 'Meta Ads',        organizationId: org.id } }, update: {}, create: { name: 'Meta Ads',        organizationId: org.id } }),
  ])
  console.log('✅ Lead sources seeded')

  // ── 4. PipelineStages ──────────────────────────────────────────────────────
  await Promise.all([
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'New',            organizationId: org.id } }, update: {}, create: { name: 'New',            orderIndex: 1, colorClass: 'bg-blue-100 text-blue-700',   organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Contacted',      organizationId: org.id } }, update: {}, create: { name: 'Contacted',      orderIndex: 2, colorClass: 'bg-cyan-100 text-cyan-700',   organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Chatting',       organizationId: org.id } }, update: {}, create: { name: 'Chatting',       orderIndex: 3, colorClass: 'bg-purple-100 text-purple-700', organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Negotiation',    organizationId: org.id } }, update: {}, create: { name: 'Negotiation',    orderIndex: 4, colorClass: 'bg-amber-100 text-amber-700', organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Meeting Set',    organizationId: org.id } }, update: {}, create: { name: 'Meeting Set',    orderIndex: 5, colorClass: 'bg-green-100 text-green-700', organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Cold',           organizationId: org.id } }, update: {}, create: { name: 'Cold',           orderIndex: 6, colorClass: 'bg-slate-100 text-slate-700', organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Not Interested', organizationId: org.id } }, update: {}, create: { name: 'Not Interested', orderIndex: 7, colorClass: 'bg-red-100 text-red-700',    organizationId: org.id } }),
  ])
  console.log('✅ Pipeline stages seeded')

  // ── 5. Leads from company list ─────────────────────────────────────────────
  const sourceByIndustry = (industry: string) => {
    if (industry === 'Software')          return linkedinSource.id
    if (industry === 'Digital Marketing') return metaSource.id
    return refSource.id  // Telecalling
  }

  const owners = [worker1, worker2]
  const creators = [manager, ceo]

  let count = 0
  for (const co of companies) {
    const idx        = count
    const owner      = owners[idx % 2]
    const creator    = creators[idx % 2]
    const sourceId   = sourceByIndustry(co.industry)
    const dealValue  = dealValues[idx % dealValues.length]

    await prisma.lead.create({
      data: {
        contactName:    "Manager",
        company:        co.name,
        phone:          co.phone ?? undefined,
        organizationId: org.id,
        ownerId:        owner.id,
        createdById:    creator.id,
        stage:          LeadStage.NEW,
        priority:       LeadPriority.MEDIUM,
        subStatus:      "BLANK",
        dealValueInr:   dealValue,
        sourceId,
        industry:       co.industry,
        requirement:    "No requirement added",
        followUpAt:     null,
      },
    })

    count++
  }

  console.log(`✅ ${count} leads seeded from company list`)

  console.log('\n🎉 Seed complete!')
  console.log('   CEO:      solobuildceo@gmail.com / password123')
  console.log('   Manager:  solobuildmanager@gmail.com / password123')
  console.log('   Worker 1: solobuildworker@gmail.com / password123')
  console.log('   Worker 2: solobuildworker2@gmail.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })