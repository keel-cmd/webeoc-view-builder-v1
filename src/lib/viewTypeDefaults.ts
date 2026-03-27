import { v4 as uuidv4 } from "uuid";
import type { ViewTypeDefaults } from "@/types";

const STORAGE_KEY = "webeoc-view-type-defaults";

// ─── Built-in defaults (used when no localStorage entry exists) ───────────────

const BUILTIN_DEFAULTS: Record<string, ViewTypeDefaults> = {
  input: {
    links: [
      { id: uuidv4(), sourceType: "boardresource", source: "pcem-new_nav.css", rel: "stylesheet" },
      { id: uuidv4(), sourceType: "boardresource", source: "pcem-input.css", rel: "stylesheet" },
      { id: uuidv4(), sourceType: "boardresource", source: "pcem-datatables.css", rel: "stylesheet" },
      {
        id: uuidv4(),
        sourceType: "href",
        source: "https://cdnjs.cloudflare.com/ajax/libs/slim-select/2.13.1/slimselect.min.css",
        rel: "stylesheet",
        type: "text/css",
      },
    ],
    scripts: [
      {
        id: uuidv4(),
        sourceType: "src",
        source: "https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js",
        integrity: "sha384-Fy6S3B9q64WdZWQUiU+q4/2Lc9npb8tCaSX9FK7E8HnRr0Jz8D6OP9dO5Vg3Q9ct",
        crossorigin: "anonymous",
      },
      { id: uuidv4(), sourceType: "src", source: "https://assets.juvare.com/webeoc/cxd/view-base/2.4.0/view-base.min.js" },
      { id: uuidv4(), sourceType: "src", source: "https://assets.juvare.com/webeoc/cxd/webeoc-api/4.2.1/webeoc-api.min.js" },
      { id: uuidv4(), sourceType: "src", source: "https://kit.fontawesome.com/d0f6f2aafc.js", crossorigin: "anonymous" },
      {
        id: uuidv4(),
        sourceType: "src",
        source: "https://cdnjs.cloudflare.com/ajax/libs/slim-select/2.13.1/slimselect.min.js",
        integrity: "sha512-sByHIkabhPJsGxRISbnt0bpNZw3NSAnshLhlu2AceSC+sDOyDT4NgtnDOznHulIjR07ua1SudQC25iLvFzkWTw==",
        crossorigin: "anonymous",
        referrerpolicy: "no-referrer",
      },
      { id: uuidv4(), sourceType: "src", source: "https://cdn.jsdelivr.net/npm/flatpickr" },
      { id: uuidv4(), sourceType: "boardresource", source: "pcem-utils.js", type: "text/javascript" },
      { id: uuidv4(), sourceType: "boardresource", source: "pcem-geocode.js", type: "text/javascript" },
      { id: uuidv4(), sourceType: "boardresource", source: "pcem-boardscript.js", type: "text/javascript" },
      { id: uuidv4(), sourceType: "boardresource", source: "pcem-new_input.js", type: "text/javascript" },
      { id: uuidv4(), sourceType: "boardresource", source: "pcem-datatables.js", type: "text/javascript" },
      { id: uuidv4(), sourceType: "boardresource", source: "pcem-jquery_plugins.js", type: "text/javascript" },
      {
        id: uuidv4(),
        sourceType: "src",
        source: "https://maps.googleapis.com/maps/api/js?key=AIzaSyAmIr_5nQ3rgddw3TQnahVvwjNM2GB9RNw&libraries=places&callback=initAutocomplete",
        async: true,
        defer: true,
      },
      { id: uuidv4(), sourceType: "boardresource", source: "_webeoc_dst_conditional_js", dstGlobal: true },
    ],

    formPreambleXml: `<applytheme/>
<form aria-label="Data" class="mb-0" id="input-form">
  <insertfields id="insert_fields">
    <field name="_webeoc_delete_flag">'no'</field>
    <field name="edit_datetime">GETUTCDATE()</field>
    <field name="edit_email">@sessionemail</field>
    <field name="edit_name">@sessionname</field>
    <field name="edit_position">@positionname</field>
    <field name="origin_datetime">GETUTCDATE()</field>
    <field name="origin_email">@sessionemail</field>
    <field name="origin_name">@sessionname</field>
    <field name="origin_position">@positionname</field>
  </insertfields>
  <updatefields id="update_fields">
    <field name="edit_datetime">GETUTCDATE()</field>
    <field name="edit_email">@sessionemail</field>
    <field name="edit_name">@sessionname</field>
    <field name="edit_position">@positionname</field>
  </updatefields>`,

    preScriptHtml: `<div class="d-none" id="view-data-data">
  <for-each select="/data/@*">
    <attribute name="data-{name()}">
      <value-of select="."/>
    </attribute>
  </for-each>
</div>
<div class="d-none" id="view-data-session">
  <for-each select="/data/SessionDetail/Sessions/@*">
    <attribute name="data-{name()}">
      <value-of select="."/>
    </attribute>
  </for-each>
</div>
<div class="d-none" id="view-data-userdetail">
  <for-each select="/data/userdetail/@*">
    <attribute name="data-{name()}">
      <value-of select="."/>
    </attribute>
  </for-each>
</div>
<div class="d-none" id="view-data-agencyinfo">
  <for-each select="/data/agencyinfo/@*">
    <attribute name="data-{name()}">
      <value-of select="."/>
    </attribute>
  </for-each>
</div>
<if test="/data/@dataid != 0">
  <div class="d-none" id="view-data-recorddata">
    <for-each select="/data/*[starts-with(name(), 'table_')]">
      <div class="d-none view-data-recorddata">
        <for-each select="@*">
          <attribute name="data-{name()}">
            <value-of select="."/>
          </attribute>
        </for-each>
        <attribute name="data-tablename">
          <value-of select="local-name()"/>
        </attribute>
      </div>
    </for-each>
  </div>
</if>
<if test="count(/data/ViewParameter) &gt; 0">
  <div id="view-parameters" class="d-none">
    <for-each select="/data/ViewParameter">
      <div class="viewparameter" name="{@name}">
        <value-of select="."/>
      </div>
    </for-each>
  </div>
</if>
<section class="d-none">
  <h2>Hidden Fields</h2>
  <div class="form-row">
    <div class="form-group col-12" id="iwf4vyi">
      <label class="form-label optional">Group Name</label>
    </div>
  </div>
  <div class="form-row">
    <div class="form-group col-12" id="ie6rvoi">
      <label class="form-label optional">User Data Holder</label>
      <br/>
      <span id="user-data-holder" data-dataid="{/data/@dataid}" data-username="{/data/@username}" data-sessionname="{/data/SessionDetail/Sessions/@name}" data-realname="{/data/userdetail/@realname}" data-positionname="{/data/@positionname}">
        <for-each select="/data/*[starts-with(name(), 'table_') and name() != concat('table_', /data/@tableid)]">
          <if test="not(preceding-sibling::*[starts-with(name(), 'table_') and name() != concat('table_', /data/@tableid) and name() = name(current())])">
            <attribute name="data-{name()}">
              <for-each select="/data/*[name() = name(current())]">
                <if test="position() &gt; 1">, </if>
                <value-of select="@team_name"/>
              </for-each>
            </attribute>
          </if>
        </for-each>
      </span>
    </div>
  </div>
</section>`,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadAll(): Record<string, ViewTypeDefaults> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ViewTypeDefaults>) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, ViewTypeDefaults>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getViewTypeDefaults(viewTypeId: string): ViewTypeDefaults {
  const stored = loadAll();
  return stored[viewTypeId] ?? BUILTIN_DEFAULTS[viewTypeId] ?? { links: [], scripts: [], formPreambleXml: "", preScriptHtml: "" };
}

export function saveViewTypeDefaults(viewTypeId: string, defaults: ViewTypeDefaults) {
  const all = loadAll();
  all[viewTypeId] = defaults;
  saveAll(all);
}

export function resetViewTypeDefaults(viewTypeId: string) {
  const all = loadAll();
  delete all[viewTypeId];
  saveAll(all);
}
