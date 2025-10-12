import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json
from collections import Counter
import requests
from io import StringIO

# Set page configuration
st.set_page_config(
    page_title="Swahili Health Symptom Checker",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for styling
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        color: #2E86AB;
        text-align: center;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.5rem;
        color: #A23B72;
        margin-bottom: 1rem;
    }
    .diagnosis-box {
        background-color: #F8F9FA;
        border-radius: 10px;
        padding: 20px;
        margin: 10px 0;
        border-left: 5px solid #2E86AB;
    }
    .advice-box {
        background-color: #E8F4F8;
        border-radius: 10px;
        padding: 20px;
        margin: 10px 0;
        border-left: 5px solid #18A558;
    }
    .stButton button {
        background-color: #2E86AB;
        color: white;
        font-weight: bold;
    }
    .language-toggle {
        position: absolute;
        top: 10px;
        right: 10px;
    }
</style>
""", unsafe_allow_html=True)

# Symptom and disease data (in a real app, this would come from a proper medical database)
symptom_disease_data = {
    "kikohozi": ["Ukimwi", "Kifua kikuu", "Mafua", "Pneumonia"],
    "homa": ["Malaria", "Typhoid", "Mafua", "Dengue"],
    "kichefuchefu": ["Typhoid", "Gestational", "Food Poisoning", "Migraine"],
    "kuharisha": ["Cholera", "Food Poisoning", "Typhoid", "Stomach Flu"],
    "maumivu ya kichwa": ["Migraine", "Mafua", "Malaria", "Hypertension"],
    "maumivu ya tumbo": ["Food Poisoning", "Ulcers", "Appendicitis", "Constipation"],
    "kizunguzungu": ["Anemia", "Migraine", "Hypertension", "Dehydration"],
    "kupumua kwa shida": ["Asthma", "Pneumonia", "Anemia", "COVID-19"],
    "maumivu ya kifua": ["Pneumonia", "Heart Disease", "Asthma", "Acid Reflux"],
    "uchovu": ["Anemia", "Malaria", "Diabetes", "Depression"]
}

# Medical advice in Swahili
advice_data = {
    "Malaria": "Pumzika vizuri, kunya maji mengi, na kwenda hospitali kupata dawa za malaria.",
    "Mafua": "Pumzika, kunya maji mengi, na vitamini. Dawa za kunywa zinaweza kusaidia.",
    "Typhoid": "Hitilafu ya matibabu ya typhoid inaweza kuwa hatari. Tafuta usaidizi wa matibabu mara moja.",
    "Food Poisoning": "Kunya maji mengi na epuka vyakula magumu. Tafuta usaidizi wa matibabu ikiwa dalili zinaendelea.",
    "Migraine": "Pumzika katika chumba cha giza na epuka kelele. Dawa za maumivu zinaweza kusaidia.",
    "Anemia": "Kula vyakula vilivyo na iron kama nyama nyekundu, dagaa na mboga majani.",
    "Pneumonia": "Tafuta matibabu mara moja. Antibiotics zinahitajika kwa matibabu ya pneumonia ya bakteria.",
    "Asthma": "Epuka vichocheo kama moshi na vumbi. Tumia dawa za kupumua kama ilivyoagizwa.",
    "Diabetes": "Dhibiti ulaji wa sukari na fuata mapendekezo ya daktari wako kuhusu chakula na dawa.",
    "Hypertension": "Punguza ulaji wa chumvi, zoea mara kwa mara, na dhibiti msongo wa mawazo."
}

# English translations for bilingual support
english_translations = {
    "kikohozi": "cough",
    "homa": "fever",
    "kichefuchefu": "nausea",
    "kuharisha": "diarrhea",
    "maumivu ya kichwa": "headache",
    "maumivu ya tumbo": "stomach pain",
    "kizunguzungu": "dizziness",
    "kupumua kwa shida": "difficulty breathing",
    "maumivu ya kifua": "chest pain",
    "uchovu": "fatigue",
    "Pumu": "Asthma",
    "Malaria": "Malaria",
    "Mafua": "Flu",
    "Typhoid": "Typhoid",
    "Food Poisoning": "Food Poisoning",
    "Migraine": "Migraine",
    "Anemia": "Anemia",
    "Pneumonia": "Pneumonia",
    "Diabetes": "Diabetes",
    "Hypertension": "Hypertension",
    "Ukimwi": "HIV/AIDS",
    "Kifua kikuu": "Tuberculosis",
    "Dengue": "Dengue",
    "Gestational": "Gestational Issues",
    "Stomach Flu": "Stomach Flu",
    "Ulcers": "Ulcers",
    "Appendicitis": "Appendicitis",
    "Constipation": "Constipation",
    "Dehydration": "Dehydration",
    "COVID-19": "COVID-19",
    "Heart Disease": "Heart Disease",
    "Acid Reflux": "Acid Reflux",
    "Depression": "Depression",
    "Cholera": "Cholera"
}

# Initialize session state for language
if 'language' not in st.session_state:
    st.session_state.language = 'Swahili'

# Function to toggle language
def toggle_language():
    if st.session_state.language == 'Swahili':
        st.session_state.language = 'English'
    else:
        st.session_state.language = 'Swahili'

# Language toggle button
st.sidebar.button(
    f"Switch to {'Swahili' if st.session_state.language == 'English' else 'English'}",
    on_click=toggle_language
)

# App title and description
if st.session_state.language == 'Swahili':
    st.markdown('<h1 class="main-header">🏥 Kagua Dalili za Afya kwa Kiswahili</h1>', unsafe_allow_html=True)
    st.markdown("""
    <p style='text-align: center; font-size: 1.2rem;'>
    Weka dalili zako za kiafya kwa Kiswahili na upate usaidizi wa kwanza kuhusu ugonjwa unaweza kuwa unao.
    </p>
    """, unsafe_allow_html=True)
else:
    st.markdown('<h1 class="main-header">🏥 Swahili Health Symptom Checker</h1>', unsafe_allow_html=True)
    st.markdown("""
    <p style='text-align: center; font-size: 1.2rem;'>
    Enter your health symptoms in Swahili and get preliminary guidance about possible conditions.
    </p>
    """, unsafe_allow_html=True)

# Sidebar with information
st.sidebar.header("ℹ️ Maelekezo" if st.session_state.language == 'Swahili' else "ℹ️ Instructions")
if st.session_state.language == 'Swahili':
    st.sidebar.info("""
    1. Weka dalili zako kwenye kisanduku cha maandishi (kwa Kiswahili)
    2. Au chagua dalili kutoka kwenye orodha iliyopo
    3. Bofya kitufe cha 'Kagua Dalili'
    4. Somo matokeo yaliyopendekezwa na ushauri
    5. Pakua ripoti ya matokeo ikiwa unahitaji
    """)
else:
    st.sidebar.info("""
    1. Enter your symptoms in the text box (in Swahili)
    2. Or select symptoms from the provided list
    3. Click the 'Analyze Symptoms' button
    4. Review the suggested results and advice
    5. Download a report if needed
    """)

# Disclaimer
st.sidebar.warning("⚠️ **Ilani Muhimu**" if st.session_state.language == 'Swahili' else "⚠️ **Important Notice**")
if st.session_state.language == 'Swahili':
    st.sidebar.write("""
    Hii si upimaji wa kiafya. Ni mfumo wa kusaidia tu. 
    Tafuta ushauri wa matibabu kutoka kwa wataalamu wa afya kwa matatizo yoyote ya kiafya.
    """)
else:
    st.sidebar.write("""
    This is not a medical diagnosis. It is only an assistance system.
    Seek medical advice from health professionals for any health issues.
    """)

# Main content
col1, col2 = st.columns([1, 1])

with col1:
    if st.session_state.language == 'Swahili':
        st.markdown('<h2 class="sub-header">Weka Dalili Zako</h2>', unsafe_allow_html=True)
        symptom_input = st.text_area("Andika dalili zako hapa (zikitenganishwa na koma)", 
                                   placeholder="Mfano: homa, kikohozi, maumivu ya kichwa")
        
        st.markdown("Au chagua kutoka kwenye orodha:")
        selected_symptoms = st.multiselect(
            "Chagua dalili",
            options=list(symptom_disease_data.keys()),
            default=[]
        )
        
        analyze_btn = st.button("Kagua Dalili", use_container_width=True)
    else:
        st.markdown('<h2 class="sub-header">Enter Your Symptoms</h2>', unsafe_allow_html=True)
        symptom_input = st.text_area("Enter your symptoms here (separated by commas)", 
                                   placeholder="Example: homa, kikohozi, maumivu ya kichwa")
        
        st.markdown("Or select from the list:")
        selected_symptoms = st.multiselect(
            "Select symptoms",
            options=list(symptom_disease_data.keys()),
            default=[]
        )
        
        analyze_btn = st.button("Analyze Symptoms", use_container_width=True)

# Process symptoms when button is clicked
if analyze_btn:
    # Combine text input and selected symptoms
    all_symptoms = []
    if symptom_input:
        input_symptoms = [s.strip() for s in symptom_input.split(",")]
        all_symptoms.extend(input_symptoms)
    all_symptoms.extend(selected_symptoms)
    
    if not all_symptoms:
        if st.session_state.language == 'Swahili':
            st.warning("Tafadhali weka angalau dalili moja.")
        else:
            st.warning("Please enter at least one symptom.")
    else:
        # Find possible conditions based on symptoms
        possible_conditions = []
        for symptom in all_symptoms:
            if symptom in symptom_disease_data:
                possible_conditions.extend(symptom_disease_data[symptom])
        
        # Count occurrences of each condition
        condition_counts = Counter(possible_conditions)
        total_count = sum(condition_counts.values())
        
        # Calculate probabilities
        condition_probabilities = {}
        for condition, count in condition_counts.items():
            probability = count / total_count
            condition_probabilities[condition] = probability
        
        # Sort by probability
        sorted_conditions = sorted(condition_probabilities.items(), key=lambda x: x[1], reverse=True)
        
        with col2:
            if st.session_state.language == 'Swahili':
                st.markdown('<h2 class="sub-header">Matokeo ya Uchambuzi</h2>', unsafe_allow_html=True)
                st.write(f"Dalili zilizowekwa: {', '.join(all_symptoms)}")
            else:
                st.markdown('<h2 class="sub-header">Analysis Results</h2>', unsafe_allow_html=True)
                # Translate symptoms for English display
                translated_symptoms = []
                for symptom in all_symptoms:
                    if symptom in english_translations:
                        translated_symptoms.append(english_translations[symptom])
                    else:
                        translated_symptoms.append(symptom)
                st.write(f"Symptoms entered: {', '.join(translated_symptoms)}")
            
            # Display top conditions
            if st.session_state.language == 'Swahili':
                st.markdown("##### Hali zinazowezekana za kiafya:")
            else:
                st.markdown("##### Possible health conditions:")
            
            for condition, probability in sorted_conditions[:3]:  # Show top 3
                with st.container():
                    st.markdown('<div class="diagnosis-box">', unsafe_allow_html=True)
                    
                    if st.session_state.language == 'Swahili':
                        st.markdown(f"**{condition}** (Uwezekano: {probability*100:.1f}%)")
                    else:
                        english_condition = english_translations.get(condition, condition)
                        st.markdown(f"**{english_condition}** (Probability: {probability*100:.1f}%)")
                    
                    st.markdown('</div>', unsafe_allow_html=True)
            
            # Display advice for the top condition
            if sorted_conditions:
                top_condition = sorted_conditions[0][0]
                if top_condition in advice_data:
                    with st.container():
                        st.markdown('<div class="advice-box">', unsafe_allow_html=True)
                        
                        if st.session_state.language == 'Swahili':
                            st.markdown("##### Ushauri wa Kwanza:")
                            st.write(advice_data[top_condition])
                        else:
                            st.markdown("##### Initial Advice:")
                            # For English, we might need to translate the advice
                            st.write("Seek professional medical advice. For " + 
                                    english_translations.get(top_condition, top_condition) + 
                                    ", it's important to consult with a healthcare provider.")
                        
                        st.markdown('</div>', unsafe_allow_html=True)
        
        # Visualization
        st.markdown("---")
        if st.session_state.language == 'Swahili':
            st.markdown('<h3 class="sub-header">Uwezekano wa Magonjwa</h3>', unsafe_allow_html=True)
        else:
            st.markdown('<h3 class="sub-header">Disease Probabilities</h3>', unsafe_allow_html=True)
        
        # Prepare data for visualization
        conditions = [cond[0] for cond in sorted_conditions[:5]]
        probs = [cond[1] for cond in sorted_conditions[:5]]
        
        # Create horizontal bar chart
        fig, ax = plt.subplots(figsize=(10, 6))
        y_pos = np.arange(len(conditions))
        
        # Use different colors for each bar
        colors = ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#6B0F1A']
        
        bars = ax.barh(y_pos, probs, color=colors[:len(conditions)])
        ax.set_yticks(y_pos)
        
        if st.session_state.language == 'Swahili':
            ax.set_yticklabels(conditions)
            ax.set_xlabel('Uwezekano')
            ax.set_title('Uwezekano wa Magonjwa Kulingana na Dalili')
        else:
            # Translate condition names for English display
            translated_conditions = [english_translations.get(cond, cond) for cond in conditions]
            ax.set_yticklabels(translated_conditions)
            ax.set_xlabel('Probability')
            ax.set_title('Disease Probabilities Based on Symptoms')
        
        # Add probability percentages on the bars
        for i, (v, p) in enumerate(zip(probs, conditions)):
            prob_percent = f"{v*100:.1f}%"
            ax.text(v + 0.01, i, prob_percent, color='black', fontweight='bold')
        
        plt.tight_layout()
        st.pyplot(fig)
        
        # Download report
        if st.session_state.language == 'Swahili':
            st.download_button(
                label="Pakua Ripoti ya Matokeo",
                data=f"Matokeo ya Uchambuzi wa Dalili:\n\nDalili: {', '.join(all_symptoms)}\n\nMatokeo:\n" + 
                     "\n".join([f"- {cond}: {prob*100:.1f}%" for cond, prob in sorted_conditions[:5]]) +
                     f"\n\nUshauri: {advice_data.get(top_condition, 'Tafuta ushauri wa kimatibabu')}",
                file_name="ripoti_ya_dalili.txt",
                mime="text/plain"
            )
        else:
            st.download_button(
                label="Download Results Report",
                data=f"Symptom Analysis Results:\n\nSymptoms: {', '.join(all_symptoms)}\n\nResults:\n" + 
                     "\n".join([f"- {english_translations.get(cond, cond)}: {prob*100:.1f}%" for cond, prob in sorted_conditions[:5]]) +
                     f"\n\nAdvice: Seek professional medical advice for {english_translations.get(top_condition, top_condition)}",
                file_name="symptom_report.txt",
                mime="text/plain"
            )

# Footer
st.markdown("---")
if st.session_state.language == 'Swahili':
    st.markdown("""
    <div style='text-align: center;'>
        <p>Huduma hii inatolewa kwa madhumuni ya usaidizi tu na haibadilishi ushauri wa matibabu kutoka kwa wataalamu wa afya.</p>
        <p>© 2023 Kagua Dalili za Afya kwa Kiswahili</p>
    </div>
    """, unsafe_allow_html=True)
else:
    st.markdown("""
    <div style='text-align: center;'>
        <p>This service is provided for assistance purposes only and does not replace medical advice from health professionals.</p>
        <p>© 2023 Swahili Health Symptom Checker</p>
    </div>
    """, unsafe_allow_html=True)