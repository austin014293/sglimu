# test_recover.py
import sys
import chardet

with open("index.html", "rb") as f:
    raw_data = f.read()

# Let's say Powershell read EUC-KR as Windows-1252 or CP949? 
# Get-Content without encoding reads as Default (which in KOR windows is CP949).
# If a UTF-8 file (without BOM) was read as CP949, then some bytes became Korean characters, some became ? (FFFD errors).
# Then it was saved as UTF-8. 
# There's a chance the FFFD errors make it irreversible. Let's see how much FFFD it has.
fffd_count = raw_data.count(b'\xef\xbf\xbd')
print("FFFD count in index:", fffd_count)

# If it's irreversible, print False.
