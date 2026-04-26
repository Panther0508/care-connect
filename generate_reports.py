import json
import random
import sys

# Define data pools
states = [
    "Lagos State", "Kano State", "Oyo State", "Rivers State", "Enugu State", 
    "Kaduna State", "Benue State", "Abuja FCT", "Delta State", "Edo State", 
    "Imo State", "Plateau State", "Kwara State", "Osun State", "Ondo State", 
    "Bauchi State", "Niger State", "Anambra State"
]

cities_by_state = {
    "Lagos State": ["Lagos", "Ikeja", "Surulere", "Victoria Island", "Lekki", "Ajah", "Badagry"],
    "Kano State": ["Kano", "Kano Municipal", "Fagge", "Dala", "Gwarzo"],
    "Oyo State": ["Ibadan", "Oyo Town", "Ogbonmoso", "Saki", "Iseyin"],
    "Rivers State": ["Port Harcourt", "Obio-Akpor", "Eleme", "Bonny", "Degema"],
    "Enugu State": ["Enugu", "Nsukka", "Awgu", "Udi", "Oji River"],
    "Kaduna State": ["Kaduna", "Zaria", "Kafanchan", "Kauru", "Sabon Gari"],
    "Benue State": ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala", "Vandeikya"],
    "Abuja FCT": ["Abuja", "Garki", "Wuse", "Asokoro", "Maitama", "Gwarinpa"],
    "Delta State": ["Warri", "Asaba", "Sapele", "Ughelli", "Agbor"],
    "Edo State": ["Benin City", "Ubiaja", "Ekpoma", "Uromi", "Akoko-Edo"],
    "Imo State": ["Owerri", "Orlu", "Okigwe", "Mbaise", "Ehime Mbano"],
    "Plateau State": ["Jos", "Bukuru", "Shendam", "Langtang", "Pankshin"],
    "Kwara State": ["Ilorin", "Offa", "Osi", "Kaiama", "Lafiaji"],
    "Osun State": ["Osogbo", "Ile-Ife", "Ilesa", "Ikirun", "Ejigbo"],
    "Ondo State": ["Akure", "Ondo Town", "Owo", "Ikare", "Okitipupa"],
    "Bauchi State": ["Bauchi", "Azare", "Bogoro", "Ganjuwa", "Tafawa Balewa"],
    "Niger State": ["Minna", "Bida", "Suleja", "Gbako", "Agaie"],
    "Anambra State": ["Awka", "Onitsha", "Nnewi", "Ekwele", "Oyi"]
}

facility_prefixes = [
    "General Hospital", "St. ", "Faith Foundation", "Hope Clinic", "Peace Medical Centre",
    "LifeLine Hospital", "Grace Maternity Home", "Unity Health Post", "Blessed Clinic",
    "Royal Care Hospital", "Primus Medical", "Eden Specialist", "Covenant Hospital",
    "New Life Clinic", "Mercy Health Centre"
]

facility_suffixes = [
    "Clinic", "Hospital", "Health Post", "Maternity Home", "Medical Centre", "Specialist Hospital"
]

service_options = [
    "Pediatric malaria treatment", "Immunization", "Nutrition counselling", 
    "Antenatal care", "Postnatal care", "Family planning", "HIV testing and counselling",
    "TB treatment", "Emergency obstetric care", "Surgical services", "Minor surgery",
    "Dental care", "Optometry", "Physiotherapy", "Laboratory services", 
    "Ultrasound scanning", "X-ray", "Pharmacy", "Emergency room", 
    "Outpatient consultation", "Inpatient wards", "HIV treatment (ART)", 
    "Malaria treatment", "Diabetes management", "Hypertension clinic"
]

constraints_phrases = [
    "frequent power outages", "intermittent electricity", "no running water", 
    "limited staffing on weekends", "staff shortage", "broken ultrasound machine",
    "non-functional generator", "inadequate drug stock", "poor road access",
    "lack of incinerator", "no ambulance service", "limited bed capacity",
    "outdated equipment", "water supply challenges", "irregular vaccine supply"
]

positive_phrases = [
    "functional ultrasound", "IV drip station", "well-equipped lab", "solar power backup",
    "adequate beds", "trained staff", "functional generator", "clean water supply",
    "recently renovated", "newly donated equipment"
]

def random_phone():
    prefixes = ["080", "070", "090", "081", "071"]
    prefix = random.choice(prefixes)
    part1 = f"{random.randint(100,999)}"
    part2 = f"{random.randint(1000,9999)}"
    return f"{prefix}-{part1}-{part2}"

def random_distance():
    return round(random.uniform(0.5, 45.0), 1)

def random_services():
    k = random.randint(2,5)
    return random.sample(service_options, k)

def make_report_text(facility, services, has_pediatric, has_emergency, constraint_mentioned):
    sentences = []
    inspection_date = f"{random.randint(1,28)} {random.choice(['January','February','March','April','May','June','July','August','September','October','November','December'])} 2026"
    sentences.append(f"Inspection on {inspection_date} found {facility} operational with varying service levels.")
    svc_list = ", ".join(services[:3])
    equip = random.choice(positive_phrases) if random.random() > 0.3 else ""
    if equip:
        sentences.append(f"Services noted include {svc_list} with {equip}.")
    else:
        sentences.append(f"Services observed: {svc_list}.")
    if constraint_mentioned:
        constraint = random.choice(constraints_phrases)
        sentences.append(f"Limitations observed: {constraint}; also noted {random.choice(['bed availability limited to','only'])} {random.randint(2,12)} inpatient beds.")
    else:
        beds = random.randint(4,20)
        sentences.append(f"Bed capacity approximately {beds} beds, with {random.choice(['some','moderate'])} occupancy.")
    if random.random() > 0.5:
        staff_note = random.choice(["Staffing adequate on weekdays but thin on weekends.", 
                                    "Nursing staff commended for dedication despite delays in salary payments.",
                                    "Doctor present only twice a week; nurses handle routine care."])
        sentences.append(staff_note)
    else:
        power_note = random.choice(["Power supply reliant on generator with erratic fuel supply.", 
                                    "Solar panels installed but insufficient for full load.",
                                    "Electricity from national grid with daily load-shedding."])
        sentences.append(power_note)
    if random.random() > 0.6:
        merged = sentences[0].rstrip('.') + ", " + sentences[1].lower()
        sentences = [merged] + sentences[2:]
    if len(sentences) > 4:
        sentences = sentences[:4]
    elif len(sentences) < 2:
        sentences.append("Further details pending verification.")
    return " ".join(sentences)

def generate_facility(idx):
    state = random.choice(states)
    city = random.choice(cities_by_state[state])
    distance = round(random.uniform(0.5, 45.0), 1)
    location = f"{city}, {state}, {distance} km"
    facility_name = f"{random.choice(facility_prefixes)} {random.choice(['of', 'in', ''])} {city}".strip()
    facility_name = " ".join(facility_name.split())
    if random.random() > 0.4:
        facility_name += f" {random.choice(facility_suffixes)}"
    if random.random() > 0.9:
        facility_name = f"{facility_name} {idx}"
    services = random_services()
    has_pediatric = any("Pediatric" in s or "child" in s.lower() for s in services)
    has_emergency = any("Emergency" in s or "Surgical" in s for s in services)
    constraint_mentioned = random.random() > 0.6
    contact = random_phone()
    report_text = make_report_text(facility_name, services, has_pediatric, has_emergency, constraint_mentioned)
    return {
        "id": f"fac-{idx:03d}",
        "facility": facility_name,
        "location": location,
        "services": services,
        "contact": contact,
        "distance": distance,
        "report_text": report_text
    }

facilities = [generate_facility(i+1) for i in range(100)]

# Adjust to meet quotas
pediatric_count = sum(1 for f in facilities if any("Pediatric" in s or "child" in s.lower() for s in f["services"]))
if pediatric_count < 10:
    indices = [i for i, f in enumerate(facilities) if not any("Pediatric" in s or "child" in s.lower() for s in f["services"])]
    random.shuffle(indices)
    for i in indices[:10-pediatric_count]:
        f = facilities[i]
        if f["services"]:
            idx_replace = random.randrange(len(f["services"]))
            f["services"][idx_replace] = random.choice(["Pediatric malaria treatment", "Immunization", "Nutrition counselling"])
        else:
            f["services"] = ["Pediatric malaria treatment"]
        has_pediatric = True
        has_emergency = any("Emergency" in s or "Surgical" in s for s in f["services"])
        constraint = "limited staffing on weekends" in f["report_text"] or "frequent power outages" in f["report_text"]
        f["report_text"] = make_report_text(f["facility"], f["services"], has_pediatric, has_emergency, constraint)

emergency_count = sum(1 for f in facilities if any("Emergency" in s or "Surgical" in s for s in f["services"]))
if emergency_count < 5:
    indices = [i for i, f in enumerate(facilities) if not any("Emergency" in s or "Surgical" in s for s in f["services"])]
    random.shuffle(indices)
    for i in indices[:5-emergency_count]:
        f = facilities[i]
        if f["services"]:
            idx_replace = random.randrange(len(f["services"]))
            f["services"][idx_replace] = random.choice(["Emergency obstetric care", "Surgical services", "Minor surgery", "Emergency room"])
        else:
            f["services"] = ["Emergency obstetric care"]
        has_pediatric = any("Pediatric" in s or "child" in s.lower() for s in f["services"])
        has_emergency = True
        constraint = "limited staffing on weekends" in f["report_text"] or "frequent power outages" in f["report_text"]
        f["report_text"] = make_report_text(f["facility"], f["services"], has_pediatric, has_emergency, constraint)

def has_constraint(text):
    phrases = ["power outage", "electricity", "no running water", "staffing", "staff shortage", "broken", "non-functional", 
               "inadequate", "poor road", "lack of", "no ambulance", "limited bed", "outdated", "water supply", "irregular vaccine"]
    return any(p in text.lower() for p in phrases)

constraint_count = sum(1 for f in facilities if has_constraint(f["report_text"]))
if constraint_count < 8:
    indices = [i for i, f in enumerate(facilities) if not has_constraint(f["report_text"])]
    random.shuffle(indices)
    for i in indices[:8-constraint_count]:
        f = facilities[i]
        constraint_phrase = random.choice(constraints_phrases)
        if f["report_text"].endswith('.'):
            f["report_text"] = f["report_text"][:-1] + f"; {constraint_phrase}."
        else:
            f["report_text"] = f["report_text"] + f"; {constraint_phrase}."

# Output JSON
print(json.dumps(facilities, indent=2))