/**
 * seed-leads.ts
 * Usage: npx tsx seed-leads.ts
 *
 * ⚠️  Set YOUR_USER_ID and YOUR_ORG_ID before running.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── CONFIGURE THESE ──────────────────────────────────────────────────────────
const YOUR_USER_ID = "6d7b2b3e-096b-4433-994c-61e1a3557bf9";
const YOUR_ORG_ID = "a5126894-537a-41a0-97bb-981b327b3eb2";
// ──────────────────────────────────────────────────────────────────────────────

const leads = [
  { company: "Digikliq", phone: "9664841852", category: "digital marketing", address: "Ravija Plaza, 228, beside times square, Thaltej, Ahmedabad, Gujarat 380054", size: "50" },
  { company: "Sunlight Digital", phone: "9054062558", category: "digital marketing", address: "G I D C Industrial Area, Odhav, Ahmedabad, Gujarat 382415", size: "10" },
  { company: "ShoutnHike", phone: "9974360053", category: "digital marketing", address: "Office No. 801, 3, Rajnagar Club Lane, Ambawadi, Ahmedabad, Gujarat 380006", size: "50" },
  { company: "Ag Digital Marketing", phone: "8511881433", category: "digital marketing", address: "Office No-507, Elight Magnum, Sola Rd, Ahmedabad, Gujarat 380061", size: "N/A" },
  { company: "Mark Honest Digital Solution Pvt. Ltd.", phone: "8866512292", category: "digital marketing", address: "Avani Icon, 208, near Hari Darshan, Nava Naroda, Ahmedabad, Gujarat 382330", size: "50" },
  { company: "DM Tech Studio", phone: "9265438987", category: "digital marketing", address: "Sun Gravitas, 1139-1140, Rajmani Society, Shyamal, Ahmedabad, Gujarat 380015", size: "50" },
  { company: "Digital Sky 360", phone: "9909013563", category: "digital marketing", address: "802 Abhishree Adroit, Mansi Cross Road, Judges Bunglow Rd, Ahmedabad, Gujarat 380015", size: "50" },
  { company: "Kleverish", phone: "9328413256", category: "digital marketing", address: "Shivalik Shilp 2, 521, Judges Bunglow Rd, Vastrapur, Ahmedabad, Gujarat 380015", size: "10" },
  { company: "Thanksweb Marketing Pvt. Ltd.", phone: "8141990085", category: "digital marketing", address: "Ganesh Glory 11, E-706, Jagatpur Rd, Gota, Ahmedabad, Gujarat 382470", size: "50" },
  { company: "Triovate Pvt Ltd", phone: "9408968634", category: "digital marketing", address: "10th Floor 1018, Fortune Business Hub, Science City Rd, Sola, Ahmedabad, Gujarat 380060", size: "50" },
  { company: "Vinayak Infosoft", phone: "9426360578", category: "digital marketing", address: "331, New Cloth Market, O/s Raipur Gate, Sarangpur, Ahmedabad, Gujarat 380002", size: "200" },
  { company: "ARE Infotech", phone: "9974991413", category: "digital marketing", address: "Surmount Complex, 306, Sarkhej - Gandhinagar Hwy, Satellite, Ahmedabad, Gujarat 380054", size: "50" },
  { company: "Digital Pundit", phone: "9173749033", category: "digital marketing", address: "Shivalik Square, 709, 132 Feet Ring Rd, Old Wadaj, Ahmedabad, Gujarat 380013", size: "10" },
  { company: "UV Digital Solution", phone: "9023079063", category: "digital marketing", address: "Hilltown landmark, 622, Nikol - Naroda Rd, Nikol, Ahmedabad, Gujarat 382350", size: "10" },
  { company: "SmartFish Design", phone: "7490021947", category: "digital marketing", address: "Mansi Cross Road, 806, Abhishree Adroit, Judges Bunglow Rd, Ahmedabad, Gujarat 380015", size: "50" },
  { company: "Albatroz Digital", phone: "9327436707", category: "digital marketing", address: "Arjun Tower, 23-F.F, Bhuyangdev Rd, Ghatlodiya, Ahmedabad, Gujarat 380061", size: "N/A" },
  { company: "Growup Business Solution", phone: "7414063433", category: "digital marketing", address: "Girivar Glean Mall, 617, Sardar Patel Ring Rd, Odhav, Ahmedabad, Gujarat 382415", size: "50" },
  { company: "Alphesh Vaghela", phone: "9725697456", category: "digital marketing", address: "Sahaj Residency, E-503, Nikol, Ahmedabad, Gujarat 380049", size: "1" },
  { company: "Linkgenic Digitech", phone: "9149480784", category: "digital marketing", address: "1002, Titanium City Center, C-1001, Prahlad Nagar, Ahmedabad, Gujarat 380015", size: "50" },
  { company: "ETA Marketing Solution", phone: "7383891097", category: "digital marketing", address: "Sivanta One, B-613-614, opp. Bank Of Baroda, Pritam Nagar, Paldi, Ahmedabad, Gujarat 380006", size: "50" },
  { company: "Stock Media", phone: "7043841319", category: "digital marketing", address: "502, Phoenix, nr. Honest restaurant, Navrangpura, Ahmedabad, Gujarat 380009", size: "50" },
  { company: "Flora Fountain", phone: "9558079502", category: "digital marketing", address: "1302, 13th Floor, Shivalik Shilp Iskcon Cross Road, Ahmedabad, Gujarat 380058", size: "50" },
  { company: "ASDM", phone: "9016970734", category: "digital marketing", address: "217, Shangrila Arcade, Shyamal Cross Rd, Shyamal, Ahmedabad, Gujarat 380015", size: "N/A" },
  { company: "City Business Group", phone: "8000262626", category: "digital marketing", address: "5th Floor, Sanidhya Complex, 41, Ashram Rd, Ellisbridge, Ahmedabad, Gujarat 380009", size: "N/A" },
  { company: "Gandhi Media Solutions", phone: "9099229964", category: "digital marketing", address: "Office No - 507, Elite Magnum, beside Solaris Business Hub, Naranpura, Ahmedabad, Gujarat 380013", size: "50" },
  { company: "Dizinfinity", phone: "6356699123", category: "digital marketing", address: "Shilp Zaveri, 706, Shyamal Cross Rd, Shyamal, Ahmedabad, Gujarat 380015", size: "50" },
  { company: "Gyani Media", phone: "9714144044", category: "digital marketing", address: "620, nr. Shyamal Cross Road, Rajmani Society, Shyamal, Ahmedabad, Gujarat 380015", size: "N/A" },
  { company: "Kaushalam Technology", phone: "9714466888", category: "digital marketing", address: "Wall Street 1, 409, near Gujarat College Road, Ellisbridge, Ahmedabad, Gujarat 380006", size: "50" },
  { company: "Litmus Branding", phone: "9998412378", category: "digital marketing", address: "10th floor, Panch Dhara Complex, Sarkhej - Gandhinagar Hwy, Bodakdev, Ahmedabad, Gujarat 380054", size: "50" },
  { company: "Studio 46 India", phone: "7940322115", category: "digital marketing", address: "1st floor, Abhijeet - II, Umashankar Joshi Marg, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380006", size: "N/A" },
  { company: "Zero Gravity Communication", phone: "7969164949", category: "digital marketing", address: "Applewoods Township, Swati Trinity, Sardar Patel Ring Rd, Sarkhej-Okaf, Ahmedabad, Gujarat 380054", size: "200" },
  { company: "Mas Callnet", phone: "7290093873", category: "Telecalling", address: "F-15, Ashram Rd, opp. Natraj Cinema, Ellisbridge, Ahmedabad, Gujarat 380009", size: "N/A" },
  { company: "Adani Customer Helpdesk", phone: "7927623264", category: "Telecalling", address: "03, Sumangalam Society, Opp Asia School, Drive In Rd, Gurukul, Ahmedabad, Gujarat 380054", size: "N/A" },
  { company: "Technomine", phone: "7940075474", category: "Telecalling", address: "4th Floor, 401-403, Shoppers Plaza, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380006", size: "500" },
  { company: "Hitech Digital Solution", phone: "7940003000", category: "Telecalling", address: "9th floor, Prahladnagar, 100 Feet Anand Nagar Rd, Ahmedabad, Gujarat 380015", size: "1000" },
  { company: "Riddhi Corporate Service", phone: "7804040404", category: "Telecalling", address: "10, Mill Officers Colony, B/h Old RBI, Ashram Rd, Ahmedabad, Gujarat 380009", size: "200" },
  { company: "Sapphire Software Solution", phone: "9099976034", category: "Software company", address: "Ganesh Meridian, C-102/103, Sarkhej - Gandhinagar Hwy, Ahmedabad, Gujarat 380060", size: "500" },
  { company: "Techcronus Business Solution", phone: "", category: "Software company", address: "B-821, Stratum @ Venus Grounds, Satellite Rd, Nehru Nagar, Ahmedabad, Gujarat 380015", size: "200" },
  { company: "Global Software", phone: "7966617000", category: "Software company", address: "SUN WESTBANK, B 905-908, Ashram Rd, Navrangpura, Ahmedabad, Gujarat 380009", size: "N/A" },
  { company: "Bacancy Technology", phone: "", category: "Software company", address: "Times Corporate Park, 15-16, Thaltej, Ahmedabad, Gujarat 380059", size: "N/A" },
  { company: "Vrinsoft Technology", phone: "7227906117", category: "Software company", address: "Shapath Hexa, 707, Sarkhej - Gandhinagar Hwy, Ahmedabad, Gujarat 380060", size: "200" },
  { company: "Infolabz", phone: "8866662662", category: "Software company", address: "405, Vraj Avenue, nr. Commerce Six Road, Navrangpura, Ahmedabad, Gujarat 380009", size: "50" },
  { company: "Add Pearl Info", phone: "8905510009", category: "Software company", address: "Law Garden, 602, Samartheshwar Mahadev Rd, Ellisbridge, Ahmedabad, Gujarat 380006", size: "N/A" },
  { company: "IT Path Solution", phone: "2717461154", category: "Software company", address: "BRTS road, 801, 8th floor Binori B Square, 1, Ambli Rd, Ahmedabad, Gujarat 380058", size: "500" },
  { company: "Techmicra IT Solution", phone: "7043786365", category: "Software company", address: "408, 4th Floor, Ashwamegh Elegance III, Nr. CN Vidhyalay, Ambawadi, Ahmedabad, Gujarat 380015", size: "200" },
  { company: "Biztech Consulting and Solution", phone: "9106747559", category: "Software company", address: "C/801 Dev Aurum Commercial, Anandnagar Cross Road, Satellite, Ahmedabad, Gujarat 380015", size: "500" },
  { company: "Infikey Technologies", phone: "6351584506", category: "Software company", address: "KRISH CUBICAL, BLOCK-B/901, nr. Govardhan Party Plot, Ahmedabad, Gujarat 380059", size: "N/A" },
  { company: "Nichetech Computer Solution", phone: "9512180005", category: "Software company", address: "409, Shital Varsha Complex, Shivranjani Cross Road, Satellite, Ahmedabad, Gujarat 380015", size: "N/A" },
  { company: "LTTRBX Technologies", phone: "9574495066", category: "Software company", address: "E-1214, GANESH GLORY 11, Jagatpur Rd, Jagatpur, Ahmedabad, Gujarat 382470", size: "10" },
  { company: "Solguruz", phone: "7802028994", category: "Software company", address: "10, Sundarvan Society, Ashram Rd, Usmanpura, Ahmedabad, Gujarat 380014", size: "200" },
  { company: "Z Tech Solution", phone: "7041785017", category: "Software company", address: "Ground Floor 1&2, Shalimar Complex, New Mahalaxmi Cross Rd, Paldi, Ahmedabad, Gujarat 380007", size: "50" },
  { company: "SPEC India", phone: "7926404031", category: "Software company", address: "SPEC House, Parth Complex, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009", size: "500" },
  { company: "IndiaNIC Infotech", phone: "7961916000", category: "Software company", address: "201, Iscon, Sarkhej - Gandhinagar Hwy, Ramdev Nagar, Ahmedabad, Gujarat 380015", size: "1000" },
  { company: "Tatvasoft", phone: "9601421472", category: "Software company", address: "TatvaSoft House, Near Shivalik Business Center, Rajpath Rangoli Rd, Ahmedabad, Gujarat 380059", size: "5000" },
  { company: "Binary Republik", phone: "6789608003", category: "Software company", address: "202 Gala Mart, Nr Gala Swing, South Bopal, Ahmedabad, Gujarat 380057", size: "200" },
  { company: "Itechnotion", phone: "7948948998", category: "Software company", address: "KP Epitome, A504-506, near Dav International School, Makarba, Ahmedabad, Gujarat 380051", size: "200" },
  { company: "iFlair Web Technologies", phone: "9558803176", category: "Software company", address: "3rd Floor, Karma Complex, Chimanlal Girdharlal Rd, Paldi, Ahmedabad, Gujarat 380007", size: "500" },
  { company: "Infilon Technologies", phone: "8160763895", category: "Software company", address: "Shivalik Shilp 2, 1101-1105, Judges Bunglow Rd, Satellite, Ahmedabad, Gujarat 380015", size: "200" },
  { company: "Visitor Cloud Technologies", phone: "8488964723", category: "Software company", address: "Avdhesh House 303, opp. Gurudwara, Bodakdev, Ahmedabad, Gujarat 380054", size: "N/A" },
  { company: "CYNIX", phone: "9081557722", category: "Software company", address: "5, Ganga, Yamuna Complex, Chimanlal Girdharlal Rd, Navrangpura, Ahmedabad, Gujarat 380009", size: "200" },
  { company: "Aspire Softserv", phone: "7946025309", category: "Software company", address: "402, Vishwa Complex, near Navrangpura, Shrimali Society, Navrangpura, Ahmedabad, Gujarat 380009", size: "N/A" },
  { company: "Innonix Tech Solution", phone: "7096499910", category: "Software company", address: "1105-1108, iSquare Corporate Park, Near CIMS Hospital, Science City Rd, Sola, Ahmedabad, Gujarat 380060", size: "200" },
  { company: "iCreative Technologies", phone: "9825877071", category: "Software company", address: "Binori BSquare3, 1001-1008, Sindhubhavan Rd, Bodakdev, Ahmedabad, Gujarat 380059", size: "N/A" },
  { company: "Citrusbug Technolabs", phone: "8128442240", category: "Software company", address: "A 411 Shivalik Corporate Park, Above D Mart, Shyamal Cross Road, Satellite, Ahmedabad, Gujarat 380015", size: "N/A" },
  { company: "Technostacks", phone: "9909712616", category: "Software company", address: "10th Floor, Sun Square, Chimanlal Girdharlal Rd, Navrangpura, Ahmedabad, Gujarat 380006", size: "50" },
  { company: "Alakmalak Technologies", phone: "7940069595", category: "Software company", address: "402, Corporate House, Ashram Rd, nr. Dinesh Hall, Navrangpura, Ahmedabad, Gujarat 380009", size: "50" },
  { company: "Web and Mobile Development Company", phone: "8200945089", category: "Software company", address: "The First, B/H Keshav Baugh Party Plot, D-307, near Shivalik Highstreet, Ahmedabad, Gujarat 380015", size: "N/A" },
  { company: "Infotronicx", phone: "9909943151", category: "Software company", address: "714, Shivalik Shilp 2, Judges Bunglow Rd, opp. ITC Narmada Hotel, Satellite, Ahmedabad, Gujarat 380015", size: "50" },
  { company: "Innovatics", phone: "9023096641", category: "Software company", address: "KP Epitome, A 509-513, nr. Dav International School, Makarba, Ahmedabad, Gujarat 380051", size: "200" },
  { company: "Staunchsys IT Services", phone: "7946043901", category: "Software company", address: "410-413, Aaron Spectra Behind Rajpath club, Sarkhej - Gandhinagar Hwy, Bodakdev, Ahmedabad, Gujarat 380059", size: "200" },
  { company: "Raindrops Infotech", phone: "9099032177", category: "Software company", address: "Shivanta one, A/804, opp. Nalli Silk Sarees, Pritam Nagar, Paldi, Ahmedabad, Gujarat 380006", size: "50" },
  { company: "Retner", phone: "9909922845", category: "Software company", address: "Sun Westbank, A-1133, Ashram Rd, Navrangpura, Ahmedabad, Gujarat 380009", size: "50" },
  { company: "Hupp Technologies", phone: "7874515717", category: "Software company", address: "Hotel BVR EK, 1201-D, near Hotel Westend, Ellisbridge, Ahmedabad, Gujarat 380006", size: "50" },
  { company: "Innoventaa Technologies", phone: "9428503923", category: "Software company", address: "405, Sigma Legacy, IIM Road, Ambawadi, Ahmedabad, Gujarat 380015", size: "N/A" },
  { company: "XLTEC Interactive", phone: "9879691209", category: "Software company", address: "301, Sheth Corporate Tower, Purshottam Mavlankar Marg, Ellisbridge, Ahmedabad, Gujarat 380006", size: "N/A" },
  { company: "AIS Technolabs", phone: "7575006403", category: "Software company", address: "B 707 A, Mondeal Square, Sarkhej - Gandhinagar Hwy, Prahlad Nagar, Ahmedabad, Gujarat 380015", size: "500" },
  { company: "DNG Web Developer", phone: "9824890699", category: "Software company", address: "1104, 11th floor, Capstone Building, opp. Chirag Motors, nr. Parimal Garden, Ellisbridge, Ahmedabad, Gujarat 380006", size: "50" },
  { company: "Nextsavy", phone: "5127824466", category: "Software company", address: "507, Phoenix, Near Vijay Cross Rd, Navrangpura, Ahmedabad, Gujarat 380009", size: "50" },
  { company: "Aglowid IT Solution", phone: "9016227777", category: "Software company", address: "501, City Center, Opp Shukan Mall, Science City Rd, Ahmedabad, Gujarat 380060", size: "N/A" },
  { company: "Orical Technologies", phone: "7041597976", category: "Software company", address: "4th floor, Silicon Tower, 405, Chimanlal Girdharlal Rd, Ellisbridge, Ahmedabad, Gujarat 380009", size: "N/A" },
  { company: "Krishaweb", phone: "7874109182", category: "Software company", address: "510, Sakar 2, Ellisbridge, Ahmedabad, Gujarat 380006", size: "200" },
  { company: "Rlogical Technosoft", phone: "7966621707", category: "Software company", address: "701, Chimanlal Girdharlal Rd, opp. Tanishq Showroom, Ellisbridge, Ahmedabad, Gujarat 380006", size: "200" },
  { company: "Shivtechnolabs", phone: "7940077787", category: "Software company", address: "7th Floor, PV Enclave, opp. Courtyard by Marriott, Bodakdev, Ahmedabad, Gujarat 380059", size: "200" },
  { company: "Kretoss Technology", phone: "8155709603", category: "Software company", address: "Shilp Corporate Park, B-1007, Rajpath Rangoli Rd, near Rajpath club, Bodakdev, Ahmedabad, Gujarat 380059", size: "50" },
  { company: "Digibid Solution", phone: "8511126355", category: "Software company", address: "204, Samruddhi Complex, Dharnidhar Cross Rd, Navrangpura, Ahmedabad, Gujarat 380009", size: "10" },
  { company: "Aark Infosoft", phone: "18008901431", category: "Software company", address: "5th, Maradia Plaza, A Wing, Chimanlal Girdharlal Rd, Ellisbridge, Ahmedabad, Gujarat 380006", size: "N/A" },
  { company: "iMobdev Technologies", phone: "7405122300", category: "Software company", address: "Shivam Complex, 201, Science City Rd, opp. Hetarth Party Plot, Sola, Ahmedabad, Gujarat 380060", size: "200" },
  { company: "Synoptek India", phone: "7966824700", category: "Software company", address: "B Block, 1st Floor, Mondeal Heights, Sarkhej - Gandhinagar Hwy, Ahmedabad, Gujarat 380015", size: "N/A" },
  { company: "Budventure Technologies", phone: "", category: "Software company", address: "303, Vedanta, opp. Usmanpura Garden, Usmanpura, Ahmedabad, Gujarat 380009", size: "200" },
  { company: "Gujarat Infotech", phone: "7927485109", category: "Software company", address: "3rd Floor, 304-307, Science City Rd, near Shell Petrol Pump, Sola, Ahmedabad, Gujarat 380060", size: "1000" },
  { company: "The One Technologies", phone: "6358288840", category: "Software company", address: "Abhishree Avenue, 303, near Nehru Nagar Circle, Ambawadi, Ahmedabad, Gujarat 380015", size: "500" },
  { company: "Waytoweb", phone: "7940041819", category: "Software company", address: "405, 3rd EYE-2 Building, Near Joyalukkas, Opp: Parimal Garden, Ambawadi, Ahmedabad, Gujarat 380006", size: "50" },
  { company: "Maxgen Technologies", phone: "9099039845", category: "Software company", address: "Abhijeet 3, 603, Netaji Rd, near Pantaloons, Mithakhali, Ellisbridge, Ahmedabad, Gujarat 380006", size: "50" },
  { company: "Shaligram", phone: "9909984567", category: "Software company", address: "3rd Floor, Shaligram Corporates, C.J Road, Ambli, Ahmedabad, Gujarat 380058", size: "500" },
  { company: "Siddh Software India", phone: "7878383940", category: "Software company", address: "703, Mahakant Complex, Paldi Rd, opposite V.S Hospital, Paldi, Ahmedabad, Gujarat 380006", size: "10" },
  { company: "Agile Infowys LLC", phone: "7622081234", category: "Software company", address: "10th Floor, Ashridhar Athens, Shivranjani Cross Rd, Ahmedabad, Gujarat 380015", size: "N/A" },
  { company: "Prioxies Technologies", phone: "9054272806", category: "Software company", address: "Titanium Business Park, B 1203-1208, Corporate Rd, Prahlad Nagar, Ahmedabad, Gujarat 382051", size: "N/A" },
  { company: "Concept Infoways", phone: "7926872057", category: "Software company", address: "Parshwa Tower, 801 B, Sarkhej - Gandhinagar Hwy, Bodakdev, Ahmedabad, Gujarat 380015", size: "200" },
  { company: "CMARIX", phone: "8000050808", category: "Software company", address: "Aaryan Work Spaces, 302-306, Drive In Rd, Memnagar, Ahmedabad, Gujarat 380052", size: "500" },
  { company: "Azilen Technologies", phone: "2717400928", category: "Software company", address: "12th & 13th Floor, B Square 1, Ambli - Bopal Rd, Bopal, Ahmedabad, Gujarat 380058", size: "1000" },
  { company: "a", phone: "1111111111", category: "Industry A", address: "Location A", size: "10" },
  { company: "b", phone: "2222222222", category: "Industry B", address: "Location B", size: "20" },
  { company: "c", phone: "3333333333", category: "Industry C", address: "Location C", size: "30" },
  { company: "d", phone: "4444444444", category: "Industry D", address: "Location D", size: "40" },
  { company: "e", phone: "5555555555", category: "Industry E", address: "Location E", size: "50" },
];

async function main() {
  if ((YOUR_USER_ID as string) === "REPLACE_WITH_YOUR_USER_ID" || (YOUR_ORG_ID as string) === "REPLACE_WITH_YOUR_ORG_ID") {
    console.error("❌  Please set YOUR_USER_ID and YOUR_ORG_ID at the top of the script.");
    process.exit(1);
  }

  console.log(`🚀 Starting import of ${leads.length} leads...`);

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    try {
      const phone = lead.phone || null;

      // Upsert by phone within the org
      if (phone) {
        const existing = await prisma.lead.findFirst({
          where: { organizationId: YOUR_ORG_ID, phone },
        });

        if (existing) {
          await prisma.lead.update({
            where: { id: existing.id },
            data: {
              industry: lead.category,
              subStatus: existing.subStatus || "BLANK",
              requirement: existing.requirement || `Company size: ${lead.size}. Address: ${lead.address}`,
            },
          });
          console.log(`🔄 Updated: ${lead.company}`);
          created++; // Counting updates as processed leads
          continue;
        }
      }

      await prisma.lead.create({
        data: {
          contactName: lead.company,
          company: lead.company,
          phone,
          email: null,
          industry: lead.category,
          subStatus: "BLANK",
          requirement: `Company size: ${lead.size}. Address: ${lead.address}`,
          dealValueInr: "0",
          organizationId: YOUR_ORG_ID,
          ownerId: YOUR_USER_ID,
          createdById: YOUR_USER_ID,
          stage: "NEW",
        },
      });

      console.log(`✅ Created: ${lead.company}`);
      created++;
    } catch (err: any) {
      console.error(`❌ Error on ${lead.company}: ${err.message}`);
      errors.push(lead.company);
    }
  }

  console.log("\n─────────────────────────────────");
  console.log(`✅ Processed : ${created}`);
  console.log(`⏭️  Skipped   : ${skipped}`);
  console.log(`❌ Errors    : ${errors.length}`);
  if (errors.length) console.log("   Failed:", errors.join(", "));
  console.log("─────────────────────────────────");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());