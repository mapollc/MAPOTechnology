<?
class Permissions
{
    public $perms;

    public function __construct($user)
    {
        $this->perms = $user['permissions'];
    }

    public function view()
    {
        return new class($this->perms) {
            public $perms;

            public function __construct($perms)
            {
                $this->perms = $perms['view'];
            }

            public function log()
            {
                return $this->perms['log'] == 1 ? true : false;
            }

            public function avys()
            {
                return $this->perms['avys'] == 1 ? true : false;
            }

            public function reports()
            {
                return $this->perms['reports'] == 1 ? true : false;
            }
        };
    }

    public function manage() {
        return new class($this->perms) {
            public $perms;

            public function __construct($perms) {
                $this->perms = $perms['manage'];
            }

            public function dispatch() {
                return $this->perms['dispatch'] == 1 ? true : false;
            }

            public function reports() {
                return $this->perms['reports'] == 1 ? true : false;
            }
        };
    }

    public function user()
    {
        return new class($this->perms) {
            public $perms;

            public function __construct($perms)
            {
                $this->perms = $perms['user'];
            }

            public function add()
            {
                return $this->perms['add'] == 1 ? true : false;
            }

            public function edit()
            {
                return $this->perms['edit'] == 1 ? true : false;
            }

            public function delete()
            {
                return $this->perms['delete'] == 1 ? true : false;
            }

            public function perms()
            {
                return $this->perms['perms'] == 1 ? true : false;
            }
        };
    }

    public function trails()
    {
        return new class($this->perms) {
            public $perms;

            public function __construct($perms)
            {
                $this->perms = $perms['trails'];
            }

            public function add()
            {
                return $this->perms['add'] == 1 ? true : false;
            }

            public function edit()
            {
                return new class($this->perms) {
                    public $perms;

                    public function __construct($perms)
                    {
                        $this->perms = $perms['edit'];
                    }

                    public function all()
                    {
                        return $this->perms['all'] == 1 ? true : false;
                    }

                    public function own()
                    {
                        return $this->perms['own'] == 1 ? true : false;
                    }
                };
            }
        };
    }

    public function fire()
    {
        return new class($this->perms) {
            public $perms;

            public function __construct($perms)
            {
                $this->perms = $perms['fire'];
            }

            public function add()
            {
                return $this->perms['add'] == 1 ? true : false;
            }

            public function edit()
            {
                return $this->perms['edit'] == 1 ? true : false;
            }
        };
    }
}

class Pagination
{
    public $currentPage;
    public $totalPages;
    public $rowsPerPage;
    public $maxPag;

    public function __construct($currentPage, $totalPages, $rowsPerPage = 100, $maxPag = 12)
    {
        $this->currentPage = $currentPage;
        $this->totalPages = $totalPages;
        $this->maxPag = $maxPag;
        $this->rowsPerPage = $rowsPerPage;
    }

    public function links()
    {
        $out = '';

        for ($i = 1; $i <= $this->totalPages; $i++) {
            if ($this->totalPages < $this->maxPag || $this->totalPages > $this->maxPag && $i < $this->maxPag || $this->totalPages > $this->maxPag && $i > $this->totalPages - $this->maxPag) {
                $out .= $this->currentPage == $i ? '<b style="font-weight:500">' . $i . '</b>' : '<a href="?results=' . $i . '">' . $i . '</a>';
            }
        }

        return $this->totalPages > 1 ? '<div class="pagination"><div>'.$out.'</div></div>' : '';
    }

    public function showing($totalRows)
    {
        return '<p style="font-size:14px;padding:0">' . ($totalRows == 0 ? 'No results found' : 'Showing results ' . number_format(($this->currentPage - 1) * $this->rowsPerPage + 1) . ' to ' . number_format(min($this->currentPage * $this->rowsPerPage, $totalRows)) . ' of ' . number_format($totalRows)) . '</p>';
    }
}

function errorCode($title, $msg)
{
    return '<div class="warnMessage"><h2>' . $title . '</h2><h3>' . $msg . '</h3><a class="btn btn-lg" href="#" onclick="history.go(-1);return false">Go Back</a></div>';
}

function invalidPermissions()
{
    return errorCode('Insufficient Permissions', 'You do not have the proper permissions to access this page or content. If you believe this is a mistake, please contact us.');
}

function pageNotFound()
{
    return errorCode('Page Not Found', 'The link your clicked or URL you entered was not found. Try a different page.');
}

function message($type, $m, $info = false, $center = false)
{
    return '<div style="margin-bottom:1em" class="message ' . ($info ? 'info' : ($type ? 'success' : 'error')) . ($center ? ' center' : '') . '">' . $m . '</div>';
}

function validSubscription($user, $planID = null) {
    if ($planID != null && $user['subscriptions'] != null) {
        for ($i = 0; $i < count($user['subscriptions']); $i++) {
            if ($user['subscriptions'][$i]['plan'] == $planID && $user['subscriptions'][$i]['active'] == 1 && $user['subscriptions'][$i]['ends'] > time()) {
                return true;
            }
        }
    }

    return false;
}

function hasPermissions($planID = null) {
    global $user;

    return $user['role'] == 3 ? true : validSubscription($user, $planID);
}

$permission = new Permissions($user);