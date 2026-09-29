import paramiko, re

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

with sftp.file("/home/tosito/nexus/frontend/index.html", "r") as f:
    html = f.read().decode("utf-8", errors="replace")

# We want to extract <!-- ═══ TAB: Herramientas ═══ --> until the end of its content.
start_marker = "<!-- ═══ TAB: Herramientas ═══ -->"
# find the end of tab-tools. It ends right before the closing divs of the document before modals.
# Let's extract from start_marker to just before "        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->"
end_marker = "        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->"

if start_marker in html and end_marker in html:
    start_idx = html.find(start_marker)
    # The end of tab-tools is exactly where end_marker starts (or thereabouts)
    # Wait, there are closing divs before tab-tools in the current html:
    # </div>\n\n</div>\n\n<!-- ═══ TAB: Herramientas ═══ -->
    
    # Actually, the safest way is:
    # 1. Strip out the entire tab-tools block.
    # 2. Insert it before the last </div> of main-content.
    
    # First, find the block.
    block = html[start_idx:html.find(end_marker)]
    
    # Now remove the block from html
    html = html[:start_idx] + html[html.find(end_marker):]
    
    # Now html has all the tabs, and then the end_marker.
    # Wait, the end_marker is "        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->"
    # Actually, in the current html, because tab-tools is at the end, if we remove it, what's left before end_marker?
    # Let's just do a clean regex replacement to find the end of tab-settings.
    pass

# A cleaner way: download the file, parse it or just fix the divs.
# The ONLY problem right now is that main-content closes BEFORE tab-tools.
# Let's find:
# </div>\n\n</div>\n\n<!-- ═══ TAB: Herramientas ═══ -->
# If this exists, it means two divs are closing before tab-tools.
# We just need to move those two closing divs to AFTER tab-tools!

replace_target = "</div>\n\n</div>\n\n<!-- ═══ TAB: Herramientas ═══ -->"
if replace_target in html:
    html = html.replace(replace_target, "\n\n<!-- ═══ TAB: Herramientas ═══ -->")
    # And we add them back at the end of tab-tools (before the modal)
    html = html.replace(end_marker, "</div>\n</div>\n" + end_marker)
    
    with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
        f.write(html)
    print("Fixed main-content div closure.")
else:
    # Try another variation
    target2 = "</div>\n</div>\n\n<!-- ═══ TAB: Herramientas ═══ -->"
    if target2 in html:
        html = html.replace(target2, "\n\n<!-- ═══ TAB: Herramientas ═══ -->")
        html = html.replace(end_marker, "</div>\n</div>\n" + end_marker)
        with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
            f.write(html)
        print("Fixed main-content div closure (variation 2).")
    else:
        # Just use regex to find any amount of closing divs before tab-tools
        match = re.search(r'(</div>\s*)+<!-- ═══ TAB: Herramientas ═══ -->', html)
        if match:
            divs = match.group(1)
            html = html.replace(match.group(0), "<!-- ═══ TAB: Herramientas ═══ -->")
            html = html.replace(end_marker, divs + end_marker)
            with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
                f.write(html)
            print("Fixed main-content div closure (regex).")
        else:
            print("Could not find closing divs before tab-tools.")

sftp.close()
c.close()